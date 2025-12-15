from typing import Optional, List
# from decimal import Decimal
from pydantic import BaseModel, Field
from pydantic.types import constr
from decimal import Decimal
from app.utils.datatable.request import ListRequest


# ===============================
# 1️⃣ Account
# ===============================

class AccountCreate(BaseModel):
    name: str
    parent_id: int
    # account_type: AccountType


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None


class AccountFilter(ListRequest):
    supplier_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None
    

class AccountParentCreate(BaseModel):
    name: Optional[str] = None
    account_no: Decimal
    account_type: Optional[str] = None
    accounts: Optional[list[int]] = None

class AccountParentUpdate(BaseModel):
    name: Optional[str] = None
    account_no: Optional[Decimal] = None
    account_type: Optional[str] = None
    accounts: Optional[list[int]] = None


# ===============================
# 2️⃣ DesignType
# ===============================
class DesignTypeCreate(BaseModel):
    name: str

class DesignTypeUpdate(BaseModel):
    name: Optional[str] = None