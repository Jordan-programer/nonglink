from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_importer
from app.core.database import get_db
from app.models.export_batch import ExportBatch, ExportBatchItem, ExportBatchStatus
from app.models.farm import Farm
from app.models.product import Product
from app.models.user import User
from app.schemas.export import ExportBatchRead, JoinBatchRequest
from app.services import export_bridge

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/batches/join", response_model=ExportBatchRead)
def join_export_batch(
    payload: JoinBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = (
        db.query(Product)
        .join(Farm, Product.farm_id == Farm.id)
        .filter(Product.id == payload.product_id, Farm.owner_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    farm = db.query(Farm).filter(Farm.id == product.farm_id).first()
    return export_bridge.join_batch(db, product=product, farm=farm, quantity=payload.quantity)


@router.get("/batches/mine", response_model=list[ExportBatchRead])
def list_my_export_batches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    batch_ids = (
        db.query(ExportBatchItem.batch_id)
        .join(Farm, ExportBatchItem.farm_id == Farm.id)
        .filter(Farm.owner_id == current_user.id)
        .distinct()
    )
    return db.query(ExportBatch).filter(ExportBatch.id.in_(batch_ids)).all()


@router.post("/batches/{batch_id}/certify", response_model=ExportBatchRead)
def certify_export_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    batch = db.query(ExportBatch).filter(ExportBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return export_bridge.certify_batch(db, batch)


@router.get("/batches/available", response_model=list[ExportBatchRead])
def list_available_export_batches(
    db: Session = Depends(get_db),
    importer: User = Depends(require_importer),
):
    return (
        db.query(ExportBatch)
        .filter(ExportBatch.status == ExportBatchStatus.CERTIFIED)
        .all()
    )


@router.post("/batches/{batch_id}/claim", response_model=ExportBatchRead)
def claim_export_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    importer: User = Depends(require_importer),
):
    batch = db.query(ExportBatch).filter(ExportBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return export_bridge.claim_batch(db, batch, importer)


@router.get("/batches/mine/claimed", response_model=list[ExportBatchRead])
def list_my_claimed_batches(
    db: Session = Depends(get_db),
    importer: User = Depends(require_importer),
):
    return db.query(ExportBatch).filter(ExportBatch.claimed_by_id == importer.id).all()
