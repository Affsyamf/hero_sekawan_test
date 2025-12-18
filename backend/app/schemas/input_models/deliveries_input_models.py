from typing import Optional, List, Union
from pydantic import BaseModel, Field, constr, conint
from datetime import date
from app.utils.datatable.request import ListRequest
class DeliveryCreate(BaseModel):
    date: date
    code: constr(strip_whitespace=True, min_length=3)
    quantity: int = Field(..., ge=1)
    sale_id: int
    return_id: Optional[int]
    roll: float = Field(0.0, ge=0, description="Roll")
    
class DeliveryUpdate(BaseModel):
    date: Optional[date]
    code: Optional[constr(strip_whitespace=True, min_length=3)]
    quantity: Optional[int] = Field(..., ge=1)
    sale_id: Optional[int]
    return_id: Optional[int]    
    roll: Optional[float]
    
class DeliveryResponse(BaseModel):
    id: int
    code: str
    date: Optional[str] = None
    quantity: Optional[float] = None
    sale_id: Optional[int] = None
    return_id: Optional[int] = None
    roll: Optional[float] = None

class DeliveryFilter(ListRequest):
    # start_date: Optional[date] = None
    # end_date: Optional[date] = None
    client_ids: Optional [List[int]] = None
    # ck_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None