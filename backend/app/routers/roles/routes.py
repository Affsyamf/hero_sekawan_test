from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.user_input_models import RoleCreate, RoleUpdate
from app.utils.datatable.request import ListRequest
from app.services.auth.role_service import RoleService
from app.utils.response import APIResponse
from app.dependencies.auth_dependency import AuthDependency
from app.models.user import User
from app.dependencies.rbac import require_admin

role_router = APIRouter(prefix="/roles", tags=["role"], dependencies=[require_admin()])

@role_router.get("/search")
def search_roles(request: ListRequest = Depends(), service: RoleService = Depends()):
    return service.list_role(request=request)

@role_router.get("/{role_id}")
def get_role_by_id(role_id: int, service: RoleService = Depends()):
    return service.get_role(role_id=role_id)

@role_router.post("/")
def create_role(request: RoleCreate, service: RoleService = Depends()):
    try:
        return service.create_role(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create role", error_detail=str(e))

@role_router.put("/{role_id}")
def update_role_by_id(role_id: int, request: RoleUpdate, service: RoleService = Depends()):
    try:
        return service.update_role(role_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update role", error_detail=str(e))

@role_router.delete("/{role_id}")
def delete_role_by_id(role_id: int, service: RoleService = Depends()):
    try:
        return service.delete_role(role_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete sales", error_detail=str(e))