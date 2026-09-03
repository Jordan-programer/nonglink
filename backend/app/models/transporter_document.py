import enum

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class TransporterDocumentType(str, enum.Enum):
    DRIVER_LICENSE = "driver_license"
    VEHICLE_REGISTRATION = "vehicle_registration"
    INSURANCE = "insurance"
    INSPECTION = "inspection"


class TransporterDocument(Base):
    __tablename__ = "transporter_documents"

    id = Column(Integer, primary_key=True, index=True)
    transporter_profile_id = Column(Integer, ForeignKey("transporter_profiles.id"), nullable=False)
    document_type = Column(db_enum(TransporterDocumentType), nullable=False)
    file_url = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    transporter_profile = relationship("TransporterProfile", back_populates="documents")
