from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class StockMovement(Base, AuditMixin):
    __tablename__ = 'stock_movements'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("StockMovementDetail", back_populates="stock_movement", lazy='selectin', cascade="all, delete-orphan")

class StockMovementDetail(Base, AuditMixin):
    __tablename__ = 'stock_movement_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 2), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey('products.id', ondelete="RESTRICT"), nullable=False)
    product = relationship("Product", back_populates="stock_movement_details", lazy='selectin')

    stock_movement_id = Column(Integer, ForeignKey('stock_movements.id', ondelete="CASCADE"), nullable=False)
    stock_movement = relationship("StockMovement", back_populates="details", lazy='selectin')