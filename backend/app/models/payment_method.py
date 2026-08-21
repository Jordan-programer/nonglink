from sqlalchemy import Column, Integer, String, ForeignKey, Table, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base

payment_method_countries = Table(
    "payment_method_countries",
    Base.metadata,
    Column("payment_method_id", Integer, ForeignKey("payment_methods.id"), primary_key=True),
    Column("country_id", Integer, ForeignKey("countries.id"), primary_key=True),
)


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    countries = relationship(
        "Country", secondary=payment_method_countries, backref="payment_methods"
    )
