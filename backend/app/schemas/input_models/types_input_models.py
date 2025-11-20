from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from pydantic.types import constr, conint


# ===============================
# 1️⃣ Account
# ===============================
class AccountCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1) = Field(..., description="Nama Akun Anak")
    parent_id: conint(ge=1) = Field(..., description="ID Akun Induk (Parent ID)")
    
    # account_type: AccountType


class AccountUpdate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nama Akun Anak")
    parent_id: Optional[conint(ge=1)] = Field(None, description="ID Akun Induk (Parent ID)")

class AccountParentCreate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nama Akun Induk")
    account_no: constr(strip_whitespace=True, min_length=1) = Field(..., description="Nomor Akun Induk (Code)")
    account_type: Optional[str] = Field(None, description="Tipe Akun")
    accounts: Optional[list[int]] = Field(None, description="Daftar ID Akun Anak yang terkait")

class AccountParentUpdate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nama Akun Induk")
    account_no: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nomor Akun Induk (Code)")
    account_type: Optional[str] = Field(None, description="Tipe Akun")
    accounts: Optional[list[int]] = Field(None, description="Daftar ID Akun Anak yang terkait")


# ===============================
# 2️⃣ DesignType
# ===============================
class DesignTypeCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1)

class DesignTypeUpdate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = None
