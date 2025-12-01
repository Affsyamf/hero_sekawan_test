from sqlalchemy import Column, Integer, String, BigInteger, Text
from sqlalchemy.orm import relationship
from app.models import Base
from app.models.mixin.TimestampMixin import TimestampMixin


class Client(Base, TimestampMixin):
    __tablename__ = 'clients'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    phone_no = Column(String, nullable=True)