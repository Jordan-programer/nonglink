from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    code = Column(String(3), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    regions = relationship("Region", back_populates="country")
