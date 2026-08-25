import enum

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class ExportBatchStatus(str, enum.Enum):
    COLLECTING = "collecting"
    CERTIFIED = "certified"
    CLAIMED = "claimed"


class ExportBatch(Base):
    __tablename__ = "export_batches"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    origin_country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    destination_country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    min_volume_target = Column(Float, nullable=False)
    total_volume = Column(Float, default=0, nullable=False)
    status = Column(db_enum(ExportBatchStatus), default=ExportBatchStatus.COLLECTING, nullable=False)
    certification_document_url = Column(String(255), nullable=True)
    certification_hash = Column(String(64), nullable=True)
    contract_document_url = Column(String(255), nullable=True)
    contract_hash = Column(String(64), nullable=True)
    claimed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    claimed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    crop = relationship("Crop")
    origin_country = relationship("Country", foreign_keys=[origin_country_id])
    destination_country = relationship("Country", foreign_keys=[destination_country_id])
    claimed_by = relationship("User", foreign_keys=[claimed_by_id])
    items = relationship("ExportBatchItem", back_populates="batch")

    @property
    def crop_name(self) -> str:
        return self.crop.name

    @property
    def origin_country_name(self) -> str:
        return self.origin_country.name

    @property
    def destination_country_name(self) -> str:
        return self.destination_country.name


class ExportBatchItem(Base):
    __tablename__ = "export_batch_items"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("export_batches.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    batch = relationship("ExportBatch", back_populates="items")
    product = relationship("Product")
    farm = relationship("Farm")
