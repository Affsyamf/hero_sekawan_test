from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal

from app.models.enum.opj_enum import (
    OpjProcessEnum, PrintingInkEnum, PeTypeEnum,
    FoldingEnum, FaceDirectionEnum, PrintingMachineEnum
)

# ------------------------
# DETAIL SCHEMAS
# ------------------------

class OpjDetailCreate(BaseModel):
    ground_color: str
    roll: float
    quantity: Optional[float]

class OpjDetailUpdate(BaseModel):
    ground_color: Optional[str] = None
    roll: Optional[float] = None
    quantity: Optional[float] = None


class OpjDetailResponse(BaseModel):
    id: int
    ground_color: str
    roll: Decimal
    quantity: Optional[Decimal]

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }


# ------------------------
# PROCESS SCHEMAS
# ------------------------

class OpjProcessCreate(BaseModel):
    process_type: OpjProcessEnum

class OpjProcessUpdate(BaseModel):
    process_type: Optional[OpjProcessEnum] = None
    

class OpjProcessResponse(BaseModel):
    id: int
    process_type: OpjProcessEnum

    class Config:
        from_attributes = True


# ------------------------
# MAIN OPJ SCHEMAS
# ------------------------

class OpjCreate(BaseModel):
    code: str
    date: datetime
    term: Optional[str]

    no_dyeing: Optional[str]
    gs_grey: Optional[str]
    gs_jadi: Optional[str]
    notes: Optional[str]

    printing_ink: PrintingInkEnum
    jenis_kain: Optional[str]
    kode_kain: Optional[str]

    lebar: Optional[float]
    repeat_gambar: Optional[float]
    garis_potong: Optional[float]

    folding: Optional[FoldingEnum]
    face_direction: Optional[FaceDirectionEnum]
    pe_type: Optional[PeTypeEnum]
    printing_machine: PrintingMachineEnum

    jumlah_warna: Optional[int]
    unit_price: Optional[float]
    unit_type: Optional[str] = "KG"

    client_id: Optional[int]
    design_id: Optional[int]

    details: List[OpjDetailCreate] = []
    processes: List[OpjProcessCreate] = []


class OpjUpdate(BaseModel):
    code: Optional[str] = None
    date: Optional[str] = None
    term: Optional[str] = None
    no_dyeing: Optional[str] = None
    gs_grey: Optional[str] = None
    gs_jadi: Optional[str] = None
    notes: Optional[str] = None
    printing_ink: Optional[PrintingInkEnum] = None
    printing_machine: Optional[PrintingMachineEnum] = None
    jenis_kain: Optional[str] = None
    kode_kain: Optional[str] = None
    lebar: Optional[int] = None
    repeat_gambar: Optional[int] = None
    garis_potong: Optional[int] = None
    jumlah_warna: Optional[int] = None
    unit_price: Optional[int] = None
    unit_type: Optional[str] = None

    folding: Optional[FoldingEnum] = None
    face_direction: Optional[FaceDirectionEnum] = None
    pe_type: Optional[PeTypeEnum] = None

    client_id: Optional[int] = None
    design_id: Optional[int] = None

    details: Optional[List[OpjDetailUpdate]] = None
    processes: Optional[List[OpjProcessUpdate]] = None


class OpjResponse(BaseModel):
    id: int
    code: str
    date: datetime
    term: Optional[str]

    printing_ink: PrintingInkEnum
    folding: Optional[FoldingEnum]
    face_direction: Optional[FaceDirectionEnum]
    pe_type: Optional[PeTypeEnum]
    printing_machine: PrintingMachineEnum

    jumlah_warna: Optional[int]
    client_id: Optional[int]
    design_id: Optional[int]

    details: List[OpjDetailResponse]
    processes: List[OpjProcessResponse]

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
