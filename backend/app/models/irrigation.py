import enum

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base, db_enum


class IrrigationStatus(str, enum.Enum):
    AGENDADA = "agendada"
    CONCLUIDA = "concluida"
    CANCELADA = "cancelada"


class Irrigation(Base):
    __tablename__ = "irrigations"
    __table_args__ = (
        CheckConstraint(
            "duration_minutes >= 1 AND duration_minutes <= 600",
            name="check_duration_minutes_range",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(
        Integer,
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scheduled_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    notes = Column(String(255), nullable=True)
    status = Column(
        db_enum(IrrigationStatus),
        default=IrrigationStatus.AGENDADA,
        nullable=False,
    )
    criada_via = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    farm = relationship("Farm", back_populates="irrigations")
