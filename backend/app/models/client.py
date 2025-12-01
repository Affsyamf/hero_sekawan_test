from sqlalchemy import Column, Integer, String, BigInteger, Text
from sqlalchemy.orm import relationship
from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin


class Client(Base, AuditMixin):
    __tablename__ = 'clients'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    phone_no = Column(String, nullable=True)