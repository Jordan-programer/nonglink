import enum

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class UserRole(str, enum.Enum):
    FARMER = "farmer"
    BUYER = "buyer"
    DISTRIBUTOR = "distributor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(db_enum(UserRole), default=UserRole.FARMER, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    farms = relationship("Farm", back_populates="owner")
    orders = relationship("Order", back_populates="buyer")
