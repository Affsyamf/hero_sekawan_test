from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class StockOpname(Base, AuditMixin):
    __tablename__ = 'stock_opnames'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)

    details = relationship("StockOpnameDetail", back_populates="stock_opname", lazy='selectin', cascade="all, delete-orphan")
    
class StockOpnameDetail(Base, AuditMixin):
    __tablename__ = 'stock_opname_details'
    
    id = Column(Integer, primary_key=True)
    system_quantity = Column(Numeric(18, 2), nullable=False)
    physical_quantity = Column(Numeric(18, 2), nullable=False)
    difference = Column(
        Numeric(18, 2),
        Computed("system_quantity - physical_quantity")
    )

    product_id = Column(Integer, ForeignKey('products.id', ondelete="RESTRICT"), nullable=False)
    product = relationship("Product", back_populates="stock_opname_details", lazy='selectin')

    stock_opname_id = Column(Integer, ForeignKey('stock_opnames.id', ondelete="CASCADE"), nullable=False)
    stock_opname = relationship("StockOpname", back_populates="details", lazy='selectin')