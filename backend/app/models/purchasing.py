from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed, text
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class Purchasing(Base, AuditMixin):
    __tablename__ = 'purchasings'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=True) # No Bukti
    purchase_order = Column(String, nullable=True) # PO Number

    supplier_id = Column(Integer, ForeignKey('suppliers.id', ondelete="RESTRICT"), nullable=False)
    supplier = relationship("Supplier", back_populates="purchasings", lazy='selectin')

    # purchase_order_id = Column(Intege) # Future relation to PurchaseOrder if needed

    details = relationship("PurchasingDetail", back_populates="purchasing", lazy='selectin', cascade="all, delete-orphan")

class PurchasingDetail(Base, AuditMixin):
    __tablename__ = 'purchasing_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 2), nullable=False)
    price = Column(Numeric(18, 2), nullable=False)
    discount = Column(Numeric(18, 2), server_default=text("0.00"))
    ppn = Column(Numeric(18, 2), server_default=text("0.00"))
    pph = Column(Numeric(18, 2), server_default=text("0.00"))
    dpp = Column(Numeric(18, 2), server_default=text("0.00"))
    tax_no = Column(String, nullable=True) # No Faktur Pajak
    exchange_rate = Column(Numeric(18, 2), server_default=text("0.00"))

    product_id = Column(Integer, ForeignKey('products.id', ondelete="RESTRICT"), nullable=False)
    product = relationship("Product", back_populates="purchasing_details", lazy='selectin')

    purchasing_id = Column(Integer, ForeignKey('purchasings.id', ondelete="CASCADE"), nullable=False)
    purchasing = relationship("Purchasing", back_populates="details", lazy='selectin')