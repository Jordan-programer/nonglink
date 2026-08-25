import enum

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class ImporterVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ImporterProfile(Base):
    __tablename__ = "importer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    verification_status = Column(
        db_enum(ImporterVerificationStatus),
        default=ImporterVerificationStatus.PENDING,
        nullable=False,
    )
    macau_registered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="importer_profile")
