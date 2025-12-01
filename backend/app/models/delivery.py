from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    CheckConstraint,
    String,
    Numeric
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base, AuditMixin


class Delivery(Base, AuditMixin):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=True)  # NO SJ
    quantity = Column(Numeric(18, 2), nullable=False)

    # FK to Sale OR Return (exclusive)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    return_id = Column(Integer, ForeignKey("returns.id"), nullable=True)

    # Relationships
    sale = relationship("Sale", back_populates="deliveries", foreign_keys=[sale_id], lazy='select')
    return_obj = relationship("Return", back_populates="deliveries", foreign_keys=[return_id], lazy='select')

    __table_args__ = (
        # exactly one of sale_id / return_id must be NOT NULL
        CheckConstraint(
            "(sale_id IS NOT NULL AND return_id IS NULL) OR "
            "(sale_id IS NULL AND return_id IS NOT NULL)",
            name="delivery_exclusive_arc",
        )
    )
