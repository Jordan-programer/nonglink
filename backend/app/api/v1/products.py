from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.price_history import PriceSource
from app.models.price_suggestion import FarmerAction, PriceSuggestion
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ImageUploadResponse, ProductCreate, ProductRead, ProductUpdate
from app.services.file_storage import save_product_image
from app.services.pricing import record_price

router = APIRouter(prefix="/products", tags=["products"])


@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    image_url = await save_product_image(file)
    return ImageUploadResponse(image_url=image_url)


def _get_owned_product(db: Session, product_id: int, current_user: User) -> Product:
    product = db.query(Product).get(product_id)
    if not product or product.farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _apply_price_suggestion_outcome(db: Session, suggestion_id: int, product: Product) -> None:
    """Feed back whether the farmer accepted the suggested price as-is or
    adjusted it, so the business rules can be refined from real behaviour."""
    suggestion = db.query(PriceSuggestion).get(suggestion_id)
    if suggestion is None:
        return

    suggestion.product_id = product.id
    suggestion.final_price = product.price_per_unit
    suggestion.farmer_action = (
        FarmerAction.ACCEPTED
        if suggestion.suggested_price == product.price_per_unit
        else FarmerAction.ADJUSTED
    )


@router.post("/", response_model=ProductRead)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).get(payload.farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")

    data = payload.model_dump()
    suggestion_id = data.pop("price_suggestion_id", None)

    product = Product(**data)
    db.add(product)
    db.flush()

    record_price(
        db,
        crop_id=product.crop_id,
        region_id=farm.region_id,
        price=product.price_per_unit,
        source=PriceSource.LISTING,
        product_id=product.id,
    )

    if suggestion_id is not None:
        _apply_price_suggestion_outcome(db, suggestion_id, product)

    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


@router.get("/mine", response_model=list[ProductRead])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Product)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
        .all()
    )


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_owned_product(db, product_id, current_user)
    updates = payload.model_dump(exclude_unset=True)
    suggestion_id = updates.pop("price_suggestion_id", None)
    price_or_crop_changed = "price_per_unit" in updates or "crop_id" in updates

    for field, value in updates.items():
        setattr(product, field, value)

    if price_or_crop_changed:
        record_price(
            db,
            crop_id=product.crop_id,
            region_id=product.farm.region_id,
            price=product.price_per_unit,
            source=PriceSource.LISTING,
            product_id=product.id,
        )

    if suggestion_id is not None:
        _apply_price_suggestion_outcome(db, suggestion_id, product)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_owned_product(db, product_id, current_user)
    db.delete(product)
    db.commit()
