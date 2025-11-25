from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ===============================
# 1️⃣ Permission
# ===============================
class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


# ===============================
# 2️⃣ Role
# ===============================
class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: List[int] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[int]] = None


# ===============================
# 3️⃣ User
# ===============================
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = True
    is_verified: Optional[bool] = False
    role_ids: List[int] = []


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    role_ids: Optional[List[int]] = None


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str


# ===============================
# 4️⃣ User Login Log
# ===============================
class UserLoginLogCreate(BaseModel):
    user_id: int
    username: str
    email: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    status: str
    error_message: Optional[str] = None


# ===============================
# 5️⃣ Authentication
# ===============================
class UserLogin(BaseModel):
    username: str
    password: str


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None