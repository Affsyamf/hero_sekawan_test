from typing import Optional, List
from pydantic import BaseModel
from app.utils.datatable.request import ListRequest


# ===============================
# 1️⃣ Supplier
# ===============================
class SupplierCreate(BaseModel):
    code: str
    name: str
    contact_info: Optional[str] = None


class SupplierUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    contact_info: Optional[str] = None


# ===============================
# 2️⃣ Product
# ===============================
class ProductCreate(BaseModel):
    code: Optional[str] = None
    name: str
    unit: Optional[str] = None
    account_id: Optional[int] = None


class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    account_id: Optional[int] = None

class ProductFilter(ListRequest):
    supplier_ids: Optional[List[int]] = None
    account_parent_ids: Optional[List[int]] = None
    account_ids: Optional[List[int]] = None

# ===============================
# 3️⃣ Design
# ===============================
class DesignCreate(BaseModel):
    code: str
    type_id: int


class DesignUpdate(BaseModel):
    code: Optional[str] = None
    type_id: Optional[int] = None
