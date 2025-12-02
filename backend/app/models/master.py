from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class Supplier(Base, AuditMixin):
    __tablename__ = 'suppliers'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    contact_info = Column(Text, nullable=True)

    purchasings = relationship("Purchasing", back_populates="supplier", lazy='select')

class Product(Base, AuditMixin):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=True, unique=True)
    name = Column(String, nullable=False, unique=True)
    unit = Column(String, nullable=True)

    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)
    account = relationship("Account", back_populates="products", lazy='joined')

    purchasing_details = relationship("PurchasingDetail", back_populates="product", lazy='select')
    stock_movement_details = relationship("StockMovementDetail", back_populates="product", lazy='select')
    color_kitchen_entry_details = relationship("ColorKitchenEntryDetail", back_populates="product", lazy='select')
    ledger_entries = relationship("Ledger", back_populates="product", lazy='select')
    stock_opname_details = relationship("StockOpnameDetail", back_populates="product", lazy='select')
    avg_cost_cache = relationship("ProductAvgCostCache", uselist=False, back_populates="product", lazy='select')

class Design(Base, AuditMixin):
    __tablename__ = 'designs'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    
    type_id = Column(Integer, ForeignKey("design_types.id"), nullable=False)
    type = relationship("DesignType", back_populates="designs", lazy='joined')

    color_kitchen_entries = relationship("ColorKitchenEntry", back_populates="design", lazy='select')

class Client(Base, AuditMixin):
    __tablename__ = 'clients'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    phone_no = Column(String, nullable=True)

    sales = relationship("Sale", back_populates="client", lazy='select')
