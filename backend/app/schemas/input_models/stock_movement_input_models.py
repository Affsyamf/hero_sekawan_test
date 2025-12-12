from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# ===============================
# 2️⃣ StockMovementDetail
# ===============================
class StockMovementDetailCreate(BaseModel):
    quantity: Decimal
    product_id: int
    stock_movement_id: int

class StockMovementDetailUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    stock_movement_id: Optional[int] = None
    
    
# ===============================
# 1️⃣ StockMovement
# ===============================
class StockMovementCreate(BaseModel):
    date: Optional[datetime] = None
    code: str
    details: List[StockMovementDetailCreate] = []

class StockMovementUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None
    details: Optional[List[StockMovementDetailUpdate]] = None

class StockMovementFilter(BaseModel):
    start_date: Optional[List[date]] = None
    end_date: Optional[List[date]] = None
    product_ids: Optional[List[int]] = None
    account_ids: Optional[List[int]] = None
    account_parent_ids: Optional[List[int]] = None
    supplier_ids: Optional[List[int]] = None
    

