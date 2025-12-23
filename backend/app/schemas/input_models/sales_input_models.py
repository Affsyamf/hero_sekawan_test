from typing import Optional, List, Union
from pydantic import BaseModel, Field, constr, conint
from datetime import date, datetime
from decimal import Decimal
from app.utils.datatable.request import ListRequest
class PaymentCreate(BaseModel):
    date: date
    amount: float = Field(..., gt=0, description="Payment amount must be greater then zeri")
    sale_id: int = Field(..., description="Related Sales ID")
    
class PaymentUpdate(BaseModel):
    date: Optional[date]
    amount: Optional[float] = Field(None, gt=0)
    sale_id: Optional[int]
    
class PaymentResponse(BaseModel):
    id: int
    date: date
    amount: Decimal
    sale_id: int

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }

class SalesCreate(BaseModel):
    date: date
    code: constr(strip_whitespace=True, min_length=3) = Field(..., description="Sales Code")
    quantity_start: int = Field(..., ge=0)
    quantity_end: int = Field(..., ge=0)
    opj_id: int = Field(..., description="Order Penjualan (OPJ) ID")
    ppn: float = Field(0.0, ge=0, description="Pajak Pertambahan Nilai (PPN) percentage")
    client_id: int
    discount: float = Field(0.0, ge=0, description="Discount percentage")
  
class SalesUpdate(BaseModel):
    date: Optional[date]
    code: Optional[constr(strip_whitespace=True, min_length=3)]
    quantity_start: Optional[int] = Field(..., ge=0)
    quantity_end: Optional[int] = Field(..., ge=0)
    opj_id: Optional[int]
    ppn: Optional[float] = Field(None, ge=0)
    client_id: Optional[int]
    discount: Optional[float] = Field(None, ge=0)
    

class SalesResponse(BaseModel):
    id: int
    code: str
    date: date
    quantity_start: int
    quantity_end: int
    client_id: int
    opj_id: int
    ppn: float
    discount: float
    

class SalesFilter(ListRequest):
    # start_date: Optional[date] = None
    # end_date: Optional[date] = None
    opj_ids: Optional[List[int]] = None
    client_ids: Optional[List[int]] = None
    design_ids: Optional[List[int]] = None
    sale_ids: Optional[Union[int, List[int]]] = None
    # ck_ids: Optional[List[int]] = None
    

class ReturnCreate(BaseModel):
    date: date
    roll: int = Field(..., ge=0)
    # quantity: int = Field(ge=1)
    quantity_start: int = Field(..., ge=0)
    quantity_end: int = Field(..., ge=0)
    sale_id: int 
    opj_id: Optional[int]
    code: Optional[str] = None
    
class ReturnUpdate(BaseModel):
    date: Optional[date] 
    roll: Optional[int] = Field(None, ge=0)
    # quantity: Optional[int] = Field(None, ge=1)
    quantity_start: Optional[int] = Field(None, ge=0)
    quantity_end: Optional[int] = Field(None, ge=0)
    sale_id: Optional[int] 
    opj_id: Optional[int]
    code: Optional[str] = None
    
class ReturnResponse(BaseModel):
    id: int
    date: datetime
    roll: int
    quantity_start: int
    quantity_end: int
    # quantity: Decimal
    sale_id: int
    code: str 
    opj_id: Optional[int] = None
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
        }
        
class ReturnFilter(ListRequest):
    # start_date: Optional[date] = None
    # end_date: Optional[date] = None
    product_ids: Optional[List[int]] = None
    client_ids: Optional[List[int]] = None
    ck_ids: Optional[List[int]] = None
    # opj_ids: Optional[List[int]] = None