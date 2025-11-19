from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

class ColorKitchenBatch(Base, AuditMixin):
    __tablename__ = "color_kitchen_batches"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)  # Generated group code
    
    entries = relationship("ColorKitchenEntry", back_populates="batch", lazy='selectin', cascade="all, delete-orphan")
    details = relationship("ColorKitchenBatchDetail", back_populates="batch", lazy='selectin', cascade="all, delete-orphan")


class ColorKitchenBatchDetail(Base, AuditMixin):
    __tablename__ = "color_kitchen_batch_details"

    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 4), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product = relationship("Product")

    batch_id = Column(Integer, ForeignKey("color_kitchen_batches.id", ondelete="CASCADE"), nullable=False)
    batch = relationship("ColorKitchenBatch", back_populates="details", lazy='selectin')
    
class ColorKitchenEntry(Base, AuditMixin):
    __tablename__ = "color_kitchen_entries"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)
    code = Column(String, nullable=False)  # OPJ
    rolls = Column(Integer)
    paste_quantity = Column(Numeric(18, 2), nullable=False)

    design_id = Column(Integer, ForeignKey("designs.id", ondelete="RESTRICT"), nullable=False)
    design = relationship("Design", back_populates="color_kitchen_entries", lazy='selectin')

    # link to batch (shared dyestuff)
    batch_id = Column(Integer, ForeignKey("color_kitchen_batches.id", ondelete="CASCADE"))
    batch = relationship("ColorKitchenBatch", back_populates="entries", lazy='selectin')

    # auxiliaries (per OPJ)
    details = relationship("ColorKitchenEntryDetail", back_populates="color_kitchen_entry", lazy='selectin', cascade="all, delete-orphan")

class ColorKitchenEntryDetail(Base, AuditMixin):
    __tablename__ = 'color_kitchen_entry_details'
    
    id = Column(Integer, primary_key=True)
    quantity = Column(Numeric(18, 4), nullable=False)

    unit_cost_used = Column(Numeric(18, 2), nullable=False)
    total_cost = Column(
        Numeric(18, 2),
        Computed("quantity * unit_cost_used")
    )

    product_id = Column(Integer, ForeignKey('products.id', ondelete="RESTRICT"), nullable=False)
    product = relationship("Product", back_populates="color_kitchen_entry_details", lazy='selectin')

    color_kitchen_entry_id = Column(Integer, ForeignKey('color_kitchen_entries.id', ondelete="CASCADE"), nullable=False)
    color_kitchen_entry = relationship("ColorKitchenEntry", back_populates="details", lazy='selectin')