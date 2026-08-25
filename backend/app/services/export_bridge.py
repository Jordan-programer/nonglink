from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.country import Country
from app.models.export_batch import ExportBatch, ExportBatchItem, ExportBatchStatus
from app.models.farm import Farm
from app.models.importer_profile import ImporterProfile, ImporterVerificationStatus
from app.models.product import Product
from app.models.region import Region
from app.models.user import User
from app.services.document_generation import generate_pdf, sha256_hex
from app.services.file_storage import save_export_document

DEFAULT_MIN_VOLUME_TARGET = 1000.0
DESTINATION_COUNTRY_CODE = "CN"


def _destination_country(db: Session) -> Country:
    country = db.query(Country).filter(Country.code == DESTINATION_COUNTRY_CODE).first()
    if not country:
        raise HTTPException(status_code=500, detail="País de destino (China) não está configurado")
    return country


def available_volume(db: Session, *, crop_id: int, origin_country_id: int) -> float:
    """Total quantity_available across all farmers' products of this crop
    whose farm is in this origin country — same join shape as
    price_suggestion.py's supply_query, summed instead of counted."""
    total = (
        db.query(func.coalesce(func.sum(Product.quantity_available), 0.0))
        .join(Farm, Product.farm_id == Farm.id)
        .join(Region, Farm.region_id == Region.id)
        .filter(Product.crop_id == crop_id, Region.country_id == origin_country_id)
        .scalar()
    )
    return float(total or 0.0)


def _origin_country_id_for_farm(db: Session, farm: Farm) -> int:
    if not farm.region_id:
        raise HTTPException(status_code=400, detail="A tua lavra não tem região definida")
    region = db.query(Region).filter(Region.id == farm.region_id).first()
    return region.country_id


def join_batch(
    db: Session,
    *,
    product: Product,
    farm: Farm,
    quantity: float,
    min_volume_target: float | None = None,
) -> ExportBatch:
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="A quantidade deve ser maior que zero")
    if quantity > product.quantity_available:
        raise HTTPException(status_code=400, detail="Quantidade superior ao stock disponível")

    origin_country_id = _origin_country_id_for_farm(db, farm)
    destination = _destination_country(db)

    batch = (
        db.query(ExportBatch)
        .filter(
            ExportBatch.crop_id == product.crop_id,
            ExportBatch.origin_country_id == origin_country_id,
            ExportBatch.status == ExportBatchStatus.COLLECTING,
        )
        .first()
    )
    if not batch:
        batch = ExportBatch(
            crop_id=product.crop_id,
            origin_country_id=origin_country_id,
            destination_country_id=destination.id,
            min_volume_target=min_volume_target or DEFAULT_MIN_VOLUME_TARGET,
            total_volume=0,
        )
        db.add(batch)
        db.flush()

    db.add(
        ExportBatchItem(
            batch_id=batch.id,
            product_id=product.id,
            farm_id=farm.id,
            quantity=quantity,
        )
    )
    product.quantity_available -= quantity
    batch.total_volume += quantity

    db.commit()
    db.refresh(batch)
    return batch


def certify_batch(db: Session, batch: ExportBatch) -> ExportBatch:
    if batch.status != ExportBatchStatus.COLLECTING:
        raise HTTPException(status_code=400, detail="Este lote já foi certificado")
    if batch.total_volume < batch.min_volume_target:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Volume insuficiente para certificar "
                f"({batch.total_volume}/{batch.min_volume_target})"
            ),
        )

    pdf_bytes = generate_pdf(
        "Certificado de Origem e Fitossanidade",
        {
            "Lote": f"#{batch.id}",
            "Cultura": batch.crop_name,
            "País de origem": batch.origin_country_name,
            "País de destino": batch.destination_country_name,
            "Volume total": f"{batch.total_volume} kg",
            "Data de certificação": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        },
    )
    url = save_export_document(pdf_bytes, f"certificado-lote-{batch.id}")

    batch.certification_document_url = url
    batch.certification_hash = sha256_hex(pdf_bytes)
    batch.status = ExportBatchStatus.CERTIFIED

    db.commit()
    db.refresh(batch)
    return batch


def claim_batch(db: Session, batch: ExportBatch, importer: User) -> ExportBatch:
    if batch.status != ExportBatchStatus.CERTIFIED:
        raise HTTPException(status_code=400, detail="Este lote ainda não está disponível")

    profile = db.query(ImporterProfile).filter(ImporterProfile.user_id == importer.id).first()
    if not profile or profile.verification_status != ImporterVerificationStatus.VERIFIED:
        raise HTTPException(status_code=403, detail="A tua conta de importador ainda não foi verificada")

    pdf_bytes = generate_pdf(
        "Contrato de Compra e Venda",
        {
            "Lote": f"#{batch.id}",
            "Cultura": batch.crop_name,
            "Volume": f"{batch.total_volume} kg",
            "Comprador": profile.company_name,
            "País de origem": batch.origin_country_name,
            "País de destino": batch.destination_country_name,
            "Certificado": batch.certification_hash or "",
            "Data": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        },
    )
    url = save_export_document(pdf_bytes, f"contrato-lote-{batch.id}")

    batch.contract_document_url = url
    batch.contract_hash = sha256_hex(pdf_bytes)
    batch.claimed_by_id = importer.id
    batch.claimed_at = datetime.utcnow()
    batch.status = ExportBatchStatus.CLAIMED

    db.commit()
    db.refresh(batch)
    return batch
