from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel


# ===============================
# 2️⃣ StockOpnameDetail
# ===============================
class StockOpnameDetailCreate(BaseModel):
    system_quantity: Decimal
    physical_quantity: Decimal
    product_id: int
    stock_opname_id: int

class StockOpnameDetailUpdate(BaseModel):
    system_quantity: Optional[Decimal] = None
    physical_quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    stock_opname_id: Optional[int] = None
    
# ===============================
# 1️⃣ StockOpname
# ===============================
class StockOpnameCreate(BaseModel):
    date: Optional[datetime] = None
    code: str
    details: list[StockOpnameDetailCreate] = []
    
class StockOpnameUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None
    details: Optional[list[StockOpnameDetailUpdate]] = None


class StockOpnameFilter(BaseModel):
    start_date: Optional[List[date]] = None
    end_date: Optional[List[date]] = None
    product_ids: Optional[List[int]] = None
    account_ids: Optional[List[int]] = None
    account_parent_ids: Optional[List[int]] = None

