from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin

from app.models.enum.registry import enum_column

class AccountParent(Base, AuditMixin):
    __tablename__ = 'account_parents'
    
    id = Column(Integer, primary_key=True)
    account_no = Column(Numeric, nullable=False, unique=True, index=True)
    name = Column(String, nullable=True)
    account_type = Column(String, nullable=True)

    accounts = relationship("Account", back_populates="parent", lazy='selectin', cascade="all, delete-orphan")

class Account(Base, AuditMixin):
    __tablename__ = 'accounts'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)

    parent_id = Column(Integer, ForeignKey('account_parents.id', ondelete="CASCADE"))
    parent = relationship("AccountParent", back_populates="accounts", lazy='selectin')
    
    products = relationship("Product", back_populates="account", lazy='selectin')
    
class DesignType(Base, AuditMixin):
    __tablename__ = "design_types"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    
    designs = relationship("Design", back_populates="type", lazy='selectin')