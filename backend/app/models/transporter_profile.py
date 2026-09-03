import enum

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class TransporterVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TransporterProfile(Base):
    __tablename__ = "transporter_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    verification_status = Column(
        db_enum(TransporterVerificationStatus),
        default=TransporterVerificationStatus.PENDING,
        nullable=False,
    )
    is_available = Column(Boolean, default=False, nullable=False)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    location_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="transporter_profile")
    vehicle = relationship("Vehicle", back_populates="transporter_profile", uselist=False)
    documents = relationship("TransporterDocument", back_populates="transporter_profile")

    @property
    def user_name(self) -> str:
        return self.user.name

    @property
    def user_email(self) -> str:
        return self.user.email
