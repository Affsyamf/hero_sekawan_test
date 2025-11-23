from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.user_input_models import UserCreate, UserUpdate
from app.utils.datatable.request import ListRequest
from app.services.auth.user_service import UserService
from app.utils.response import APIResponse
from app.dependencies.auth_dependency import AuthDependency
from app.models.user import User
from app.dependencies.rbac import require_user, require_admin

user_router = APIRouter(prefix="/users", tags=["User"])

@user_router.get("/search")
def search_users(request: ListRequest = Depends(), service: UserService = Depends(), user = require_admin()):
    return service.list_user(request=request)

@user_router.get("/{user_id}")
def get_user_by_id(user_id: int, service: UserService = Depends(), user = require_user()):
    return service.get_user(user_id=user_id)

@user_router.post("/")
def create_user(request: UserCreate, service: UserService = Depends(), user = require_admin()):
    try:
        return service.create_user(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create user", error_detail=str(e))

@user_router.put("/{user_id}")
def update_user_by_id(user_id: int, request: UserUpdate, service: UserService = Depends(), user = require_admin()):
    try:
        return service.update_user(user_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update user", error_detail=str(e))

@user_router.delete("/{user_id}")
def delete_user_by_id(user_id: int, service: UserService = Depends(), user = require_admin()):
    try:
        return service.delete_user(user_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete user", error_detail=str(e))