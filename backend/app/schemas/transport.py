from datetime import datetime

from pydantic import BaseModel

from app.models.delivery_stop import DeliveryStopStatus, DeliveryStopType
from app.models.transporter_document import TransporterDocumentType
from app.models.transporter_profile import TransporterVerificationStatus


class VehicleCreate(BaseModel):
    plate: str
    vehicle_type: str
    capacity_kg: float


class VehicleRead(BaseModel):
    id: int
    plate: str
    vehicle_type: str
    capacity_kg: float

    class Config:
        from_attributes = True


class TransporterDocumentRead(BaseModel):
    id: int
    document_type: TransporterDocumentType
    file_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransporterProfileRead(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    verification_status: TransporterVerificationStatus
    is_available: bool
    current_latitude: float | None = None
    current_longitude: float | None = None
    location_updated_at: datetime | None = None
    vehicle: VehicleRead | None = None
    documents: list[TransporterDocumentRead] = []

    class Config:
        from_attributes = True


class TransporterVerifyRequest(BaseModel):
    verification_status: TransporterVerificationStatus


class AvailabilityUpdate(BaseModel):
    is_available: bool


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float


class DeliveryStopRead(BaseModel):
    id: int
    stop_type: DeliveryStopType
    farm_id: int | None = None
    farm_name: str | None = None
    sequence_order: int
    latitude: float
    longitude: float
    status: DeliveryStopStatus
    completed_at: datetime | None = None

    class Config:
        from_attributes = True


class TransporterLocationRead(BaseModel):
    latitude: float
    longitude: float
    updated_at: datetime | None = None


class OrderTrackingRead(BaseModel):
    order_id: int
    status: str
    transporter_location: TransporterLocationRead | None = None
    stops: list[DeliveryStopRead] = []
