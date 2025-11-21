from typing import Optional
# from decimal import Decimal
from pydantic import BaseModel, Field
from pydantic.types import constr


# ===============================
# 1️⃣ Account
# ===============================

# afif
class AccountCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1) = Field(..., description="Nama Akun Anak")
    parent_account_no: constr(strip_whitespace=True, min_length=1) = Field(
        description="Nomor Akun Induk (Account Parent No) yang dipilih user"
    )

# afif trim spasi
class AccountUpdate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nama Akun Anak")
    parent_account_no: Optional[constr(strip_whitespace=True, min_length=1)] = Field(
       None,
       description="Nomor Akun Induk (Account Parent No) yang dipilih user")

class AccountParentCreate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Nama Akun Induk")
    account_no: constr(strip_whitespace=True, min_length=1) = Field(..., description="Nomor Akun Induk (Code)")
    account_type: Optional[str] = Field(None, description="Tipe Akun")
    # kirim id bukan account no
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
