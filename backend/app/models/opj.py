from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, Numeric, Computed
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.enum.registry import enum_column

from app.models import Base
from app.models.mixin.AuditMixin import AuditMixin
from app.models.enum.opj_enum import (ProcessConditionEnum, OpjProcessEnum, PeTypeEnum, 
                                      FoldingEnum, FaceDirectionEnum, PrintingMachineEnum)

class Opj(Base, AuditMixin):
    __tablename__ = 'opjs'
    
    id = Column(Integer, primary_key=True)
    code = Column(String, nullable=False, unique=True)
    date = Column(DateTime, nullable=False)
    term = Column(String, nullable=True)

    no_dyeing = Column(String, nullable=True)
    gs_grey = Column(String, nullable=True)
    gs_jadi = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    process_type = Column(enum_column(OpjProcessEnum), nullable=False)
    jenis_kain = Column(String, nullable=True)
    kode_kain = Column(String, nullable=True)

    lebar = Column(Float, nullable=True) # in cm
    repeat_gambar = Column(Float, nullable=True) # in cm
    garis_potong = Column(Float, nullable=True) # in mm

    folding = Column(enum_column(FoldingEnum), nullable=True) # Lipatan Yard / Gulung
    face_direction = Column(enum_column(FaceDirectionEnum), nullable=True) # Muka ke Dalam / Muka ke Luar
    pe_type = Column(enum_column(PeTypeEnum), nullable=True) # PE-I (Krg) PE / PE-II (Krg) PE
    printing_machine = Column(enum_column(PrintingMachineEnum), nullable=False) # Rotary / Flat

    jumlah_warna = Column(Integer, nullable=True)
    unit_price = Column(Numeric(18, 2), nullable=True)
    unit_type = Column(String, nullable=False, default="KG")

    client_id = Column(Integer, ForeignKey("clients.id", ondelete="RESTRICT"), nullable=True) # TODO: make non-nullable later
    client = relationship("Client", lazy='selectin')

    design_id = Column(Integer, ForeignKey("designs.id", ondelete="RESTRICT"), nullable=True)
    design = relationship("Design", lazy='selectin')

    details = relationship("OpjDetail", back_populates="opj", cascade="all, delete-orphan", lazy='selectin')
    processes = relationship("OpjProcessCondition", back_populates="opj", cascade="all, delete-orphan", lazy='selectin')
    color_kitchen_entries = relationship("ColorKitchenEntry", back_populates="opj", lazy='selectin')
    sales = relationship("Sale", back_populates="opj", lazy='selectin')
    return_obj = relationship("Return", back_populates="opj", lazy="selectin")


class OpjDetail(Base, AuditMixin):
    __tablename__ = 'opj_details'
    
    id = Column(Integer, primary_key=True)
    ground_color = Column(String, nullable=False)
    roll = Column(Numeric(18, 2), nullable=False)  # roll
    quantity = Column(Numeric(18, 2), nullable=True)  # kg

    opj_id = Column(Integer, ForeignKey("opjs.id", ondelete="CASCADE"), nullable=False)
    opj = relationship("Opj", back_populates="details", lazy='selectin')

class OpjProcessCondition(Base, AuditMixin):
    __tablename__ = 'opj_processes'
    
    id = Column(Integer, primary_key=True)
    process_type = Column(enum_column(ProcessConditionEnum), nullable=False)

    opj_id = Column(Integer, ForeignKey("opjs.id", ondelete="CASCADE"), nullable=False)
    opj = relationship("Opj", back_populates="processes", lazy='selectin')