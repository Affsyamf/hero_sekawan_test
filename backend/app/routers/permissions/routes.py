from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.user_input_models import PermissionCreate, PermissionUpdate
from app.utils.datatable.request import ListRequest
from app.services.auth.permission_service import PermissionService
from app.utils.response import APIResponse
from app.dependencies.auth_dependency import AuthDependency
from app.models.user import User
from app.dependencies.rbac import require_admin

permission_router = APIRouter(prefix="/permissions", tags=["Permission"], dependencies=[require_admin()])

@permission_router.get("/search")
def search_permissions(request: ListRequest = Depends(), service: PermissionService = Depends()):
    return service.list_permission(request=request)

@permission_router.get("/{permission_id}")
def get_permission_by_id(permission_id: int, service: PermissionService = Depends()):
    return service.get_permission(permission_id=permission_id)

@permission_router.post("/")
def create_permission(request: PermissionCreate, service: PermissionService = Depends()):
    try:
        return service.create_permission(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create permission", error_detail=str(e))

@permission_router.put("/{permission_id}")
def update_permission_by_id(permission_id: int, request: PermissionUpdate, service: PermissionService = Depends()):
    try:
        return service.update_permission(permission_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update permission", error_detail=str(e))

@permission_router.delete("/{permission_id}")
def delete_permission_by_id(permission_id: int, service: PermissionService = Depends()):
    try:
        return service.delete_permission(permission_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete permission", error_detail=str(e))