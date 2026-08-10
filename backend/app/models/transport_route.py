from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class TransportRoute(Base):
    __tablename__ = "transport_routes"
    __table_args__ = (
        UniqueConstraint(
            "transporter_id", "origin_region_id", "destination_region_id",
            name="uq_transporter_route",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    transporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    origin_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    destination_region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    transporter = relationship("User", foreign_keys=[transporter_id])
    origin_region = relationship("Region", foreign_keys=[origin_region_id])
    destination_region = relationship("Region", foreign_keys=[destination_region_id])

    @property
    def origin_region_name(self) -> str:
        return self.origin_region.name

    @property
    def destination_region_name(self) -> str:
        return self.destination_region.name
