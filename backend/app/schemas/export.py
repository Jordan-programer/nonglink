from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.export_batch import ExportBatchStatus
from app.models.importer_profile import ImporterVerificationStatus


class JoinBatchRequest(BaseModel):
    product_id: int
    quantity: float


class ExportBatchRead(BaseModel):
    id: int
    crop_id: int
    crop_name: str
    origin_country_id: int
    origin_country_name: str
    destination_country_id: int
    destination_country_name: str
    min_volume_target: float
    total_volume: float
    status: ExportBatchStatus
    certification_document_url: str | None = None
    certification_hash: str | None = None
    contract_document_url: str | None = None
    contract_hash: str | None = None
    claimed_by_id: int | None = None
    claimed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ImporterProfileRead(BaseModel):
    id: int
    user_id: int
    company_name: str
    verification_status: ImporterVerificationStatus
    macau_registered: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ImporterCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    macau_registered: bool = False


class ImporterVerifyRequest(BaseModel):
    verification_status: ImporterVerificationStatus
