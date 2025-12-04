from typing import Optional, List, Union
from pydantic import BaseModel, Field, constr, conint
from datetime import date
from datetime import datetime
from decimal import Decimal
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
    color_kitchen_id: int
    client_id: int
    
class SalesUpdate(BaseModel):
    date: Optional[date]
    code: Optional[constr(strip_whitespace=True, min_length=3)]
    quantity_start: Optional[int] = Field(..., ge=0)
    quantity_end: Optional[int] = Field(..., ge=0)
    color_kitchen_id: Optional[int]
    client_id: Optional[int]
    

class SalesResponse(BaseModel):
    id: int
    code: str
    date: date
    quantity_start: int
    quantity_end: int
    client_id: int
    color_kitchen_id: int


class SalesFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    client_id: Optional[int] = None
    color_kitchen_id: Optional[int] = None
    design_id: Optional[int] = None
    
    class Config:
        from_attributes = True



class ReturnCreate(BaseModel):
    date: date
    quantity: int = Field(ge=1)
    sale_id: int 
    
class ReturnUpdate(BaseModel):
    date: Optional[date] 
    quantity: Optional[int] = Field(None, ge=1)
    sale_id: Optional[int] 
    
    
class ReturnResponse(BaseModel):
    id: int
    date: datetime
    quantity: Decimal
    sale_id: int

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v),
        }