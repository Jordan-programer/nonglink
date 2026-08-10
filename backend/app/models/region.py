from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    country = relationship("Country", back_populates="regions")
    users = relationship("User", back_populates="region")
    farms = relationship("Farm", back_populates="region")

    @property
    def country_name(self) -> str:
        return self.country.name
