import enum

from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    BUYER = "buyer"
    DISTRIBUTOR = "distributor"
    TRANSPORTER = "transporter"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    phone = Column(String(30), unique=True, index=True, nullable=True)
    google_id = Column(String(64), unique=True, index=True, nullable=True)
    facebook_id = Column(String(64), unique=True, index=True, nullable=True)
    role = Column(db_enum(UserRole), default=UserRole.FARMER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    email_verification_token = Column(String(64), unique=True, index=True, nullable=True)
    email_verification_expires_at = Column(DateTime, nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    # Country an admin manages (superadmins create one admin per country).
    # Not used for farmer/buyer/distributor/transporter accounts — those are
    # scoped via region_id instead.
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    region = relationship("Region", back_populates="users")
    country = relationship("Country")
    farms = relationship("Farm", back_populates="owner")
    orders = relationship("Order", back_populates="buyer", foreign_keys="Order.buyer_id")
    deliveries = relationship("Order", back_populates="transporter", foreign_keys="Order.transporter_id")

    @property
    def country_name(self) -> str | None:
        return self.country.name if self.country else None
