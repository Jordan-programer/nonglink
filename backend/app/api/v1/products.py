from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.farm import Farm
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _get_owned_product(db: Session, product_id: int, current_user: User) -> Product:
    product = db.query(Product).get(product_id)
    if not product or product.farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductRead)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    farm = db.query(Farm).get(payload.farm_id)
    if not farm or farm.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Farm not found")

    product = Product(**payload.model_dump())
    db.add(product)
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

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

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
