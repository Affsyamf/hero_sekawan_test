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