from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel

# ===============================
# 1️⃣ ColorKitchenBatchDetail
# ===============================
class ColorKitchenBatchDetailCreate(BaseModel):
    quantity: Decimal
    product_id: int
    batch_id: int

class ColorKitchenBatchDetailUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    batch_id: Optional[int] = None
    
# ===============================
# 2️⃣ ColorKitchenBatch
# ===============================
class ColorKitchenBatchCreate(BaseModel):
    date: Optional[datetime] = None
    code: str
    details: Optional[list[ColorKitchenBatchDetailCreate]] = None

class ColorKitchenBatchUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None
    details: Optional[list[ColorKitchenBatchDetailUpdate]] = None


# ===============================
# 3️⃣ ColorKitchenEntryDetail
# ===============================
class ColorKitchenEntryDetailCreate(BaseModel):
    quantity: Decimal
    product_id: int
    color_kitchen_entry_id: int

class ColorKitchenEntryDetailUpdate(BaseModel):
    quantity: Optional[Decimal] = None
    product_id: Optional[int] = None
    color_kitchen_entry_id: Optional[int] = None
    
    
class ColorKitchenEntryFilter(BaseModel):
    start_date: Optional[List[date]] = None
    end_date: Optional[List[date]] = None
    account_ids: Optional[List[int]] = None
    account_parent_ids: Optional[List[int]] = None
    supplier_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None


# ===============================
# 4️⃣ ColorKitchenEntry
# ===============================
class ColorKitchenEntryCreate(BaseModel):
    date: Optional[datetime] = None
    code: str
    rolls: Optional[int] = None
    paste_quantity: Decimal
    design_id: int
    batch_id: Optional[int] = None
    details: Optional[list[ColorKitchenEntryDetailCreate]] = None

class ColorKitchenEntryUpdate(BaseModel):
    date: Optional[datetime] = None
    code: Optional[str] = None
    rolls: Optional[int] = None
    paste_quantity: Optional[Decimal] = None
    design_id: Optional[int] = None
    batch_id: Optional[int] = None
    details: Optional[list[ColorKitchenEntryDetailUpdate]] = None



