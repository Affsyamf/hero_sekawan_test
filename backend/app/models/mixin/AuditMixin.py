from sqlalchemy import Column, DateTime, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import declared_attr

class AuditMixin:
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    @declared_attr
    def created_by(cls):
        return Column(Integer, ForeignKey("users.id"), nullable=True)

    @declared_attr
    def updated_by(cls):
        return Column(Integer, ForeignKey("users.id"), nullable=True)

    @declared_attr
    def deleted_by(cls):
        return Column(Integer, ForeignKey("users.id"), nullable=True)
