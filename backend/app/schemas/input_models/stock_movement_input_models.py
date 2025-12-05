from typing import Optional, List
from datetime import datetime
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
    product_ids: Optional[List[int]]
    

