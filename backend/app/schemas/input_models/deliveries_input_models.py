from typing import Optional, List, Union
from pydantic import BaseModel, Field, constr, conint
from datetime import date

class DeliveryCreate(BaseModel):
    date: date
    code: constr(strip_whitespace=True, min_length=3)
    quantity: int = Field(..., ge=1)
    sale_id: int
    return_id: Optional[int]
    
class DeliveryUpdate(BaseModel):
    date: Optional[date]
    code: Optional[constr(strip_whitespace=True, min_length=3)]
    quantity: Optional[int] = Field(..., ge=1)
    sale_id: Optional[int]
    return_id: Optional[int]    
    
class DeliveryResponse(BaseModel):
    id: int
    code: str
    date: Optional[str] = None
    quantity: Optional[int] = None
    sale_id: Optional[int] = None
    return_id: Optional[int] = None
    

class DeliveryFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    client_ids: Optional [List[int]] = None
    ck_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None