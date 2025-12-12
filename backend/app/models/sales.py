from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed, text
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class Sale(Base, AuditMixin):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=True) # No Faktur Penjualan
    quantity_start = Column(Numeric(18, 2), nullable=False) # Quantity asal
    quantity_end = Column(Numeric(18, 2), nullable=False) # Quantity jadi
    ppn = Column(Numeric(18, 2), nullable=False, default=0)

    color_kitchen_id = Column(Integer, ForeignKey("color_kitchen_entries.id", ondelete="RESTRICT"), nullable=True)
    color_kitchen = relationship("ColorKitchenEntry", lazy='joined')

    client_id = Column(Integer, ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False)
    client = relationship("Client", back_populates="sales", lazy='joined')

    opj_id = Column(Integer, ForeignKey("opjs.id", ondelete="RESTRICT"), nullable=True) # TODO: make non-nullable later
    opj = relationship("Opj", back_populates="sales", lazy='joined')

    returns = relationship("Return", back_populates="sale", cascade="all, delete-orphan", lazy='select')
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan", lazy='select')
    deliveries = relationship("Delivery", back_populates="sale", foreign_keys="Delivery.sale_id", cascade="all, delete-orphan", lazy='select')


class Return(Base, AuditMixin):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False) # No Faktur Penjualan
    quantity = Column(Numeric(18, 2), nullable=False)

    # If new OPJ is assigned to perbaikan
    opj_id = Column(Integer, ForeignKey("opjs.id", ondelete="RESTRICT"), nullable=True) # TODO: maybe? make non-nullable later
    opj = relationship("Opj", back_populates="return_obj", lazy='joined')

    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="RESTRICT"), nullable=False)
    sale = relationship("Sale", back_populates="returns", lazy='joined')

    deliveries = relationship("Delivery", back_populates="return_obj", foreign_keys="Delivery.return_id", cascade="all, delete-orphan", lazy='select')

class Payment(Base, AuditMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    amount = Column(Numeric(18, 2), nullable=False)

    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="RESTRICT"), nullable=False)
    sale = relationship("Sale", back_populates="payments", lazy='joined')