from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.types_input_models import AccountParentCreate, AccountParentUpdate
from app.utils.datatable.request import ListRequest
from app.services.types.account_parent_service import AccountParentService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

account_parent_router = APIRouter(prefix="/account_parent", tags=["account parent"], dependencies=[require_user()])
        
@account_parent_router.get("/search")
def search_account_parents(request: ListRequest = Depends(), service: AccountParentService = Depends()):
    return service.list_account_parent(request=request)

@account_parent_router.get("/{account_id}")
def get_account_parent_by_id(account_id: int, service: AccountParentService = Depends()):
    return service.get_account_parent(account_id=account_id)

@account_parent_router.post("/")
def create_account_parent(request: AccountParentCreate, service: AccountParentService = Depends()):
    try:
        return service.create_account_parent(request)
    except Exception as e:
        print(f"Error Detail : {e}")
        return APIResponse.internal_error(message="Failed to create account", error_detail=str(e))

@account_parent_router.put("/{account_id}")
def update_account_parent_by_id(account_id: int, request: AccountParentUpdate, service: AccountParentService = Depends()):
    try:
        return service.update_account_parent(account_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update account", error_detail=str(e))

@account_parent_router.delete("/{account_id}")
def delete_account_parent_by_id(account_id: int, service: AccountParentService = Depends()):
    try:
        return service.delete_account_parent(account_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete account", error_detail=str(e))