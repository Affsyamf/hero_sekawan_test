from typing import Optional, List
from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from decimal import Decimal

from app.models.enum.opj_enum import (
    OpjProcessEnum, ProcessConditionEnum, PeTypeEnum,
    FoldingEnum, FaceDirectionEnum, PrintingMachineEnum
)


# DETAIL SCHEMAS


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



# PROCESS SCHEMAS


class OpjProcessCreate(BaseModel):
    process_type: ProcessConditionEnum

class OpjProcessUpdate(BaseModel):
    process_type: Optional[ProcessConditionEnum] = None
    

class OpjProcessResponse(BaseModel):
    id: int
    process_type: ProcessConditionEnum

    class Config:
        from_attributes = True


# MAIN OPJ SCHEMAS


class OpjCreate(BaseModel):
    code: str
    date: datetime
    term: Optional[str] = None

    no_dyeing: Optional[str] = None
    gs_grey: Optional[str] = None
    gs_jadi: Optional[str] = None
    notes: Optional[str] = None

    process_type: OpjProcessEnum
    jenis_kain: Optional[str] = None
    kode_kain: Optional[str] = None

    lebar: Optional[Decimal] = None # in cm
    repeat_gambar: Optional[Decimal] = None # in cm
    garis_potong: Optional[Decimal] = None # in mm

    folding: Optional[FoldingEnum] = None # Lipatan Yard / Gulung
    face_direction: Optional[FaceDirectionEnum] = None # Muka ke Dalam / Muka ke Luar
    pe_type: Optional[PeTypeEnum] = None # PE-I (Krg) PE / PE-II (Krg) PE
    printing_machine: PrintingMachineEnum # Rotary / Flat
    
    jumlah_warna: Optional[int] = None
    unit_price: Optional[Decimal] = None
    unit_type: Optional[str] = "KG"

    client_id: Optional[int] = None # TODO: make non-nullable later
    design_id: Optional[int] = None # TODO: make non-nullable later

    details: List[OpjDetailCreate] = Field(default_factory=list)
    processes: List[OpjProcessCreate] = Field(default_factory=list)


class OpjUpdate(BaseModel):
    code: Optional[str] = None
    date: Optional[str] = None
    term: Optional[str] = None
    no_dyeing: Optional[str] = None
    gs_grey: Optional[str] = None
    gs_jadi: Optional[str] = None
    notes: Optional[str] = None
    process_type: Optional[OpjProcessEnum] = None
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

    process_type: OpjProcessEnum
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

class OpjFilter(BaseModel):
    start_date: Optional [List[date]] = None
    end_date: Optional [List[date]] = None
    design_ids: Optional[List[int]] = None
    printing_machine: Optional[List[str]] = None
    processes_type: Optional[List[str]] = None
    
    @validator("printing_machine", "processes_type", pre=True, each_item=True)
    def upper_case_enum(cls, v):
        if isinstance(v, str):
            return v.upper()
        return v
            