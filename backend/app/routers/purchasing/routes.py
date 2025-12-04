from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.purchasing_input_models import PurchasingCreate, PurchasingUpdate, PurchasingFilter
from app.utils.datatable.request import ListRequest
from app.services.purchasing.purchasing_service import PurchasingService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

purchasing_router = APIRouter(prefix="/purchasing", tags=["purchasing"], dependencies=[require_user()])

@purchasing_router.post("/search")
def search_purchasings(filters: PurchasingFilter, request: ListRequest = Depends(),  service: PurchasingService = Depends()):
    return service.list_purchasing(request=request, filters=filters)

@purchasing_router.get("/{purchasing_id}")
def get_purchasing_by_id(purchasing_id: int, service: PurchasingService = Depends()):
    return service.get_purchasing(purchasing_id=purchasing_id)

@purchasing_router.post("/")
def create_purchasing(request: PurchasingCreate, service: PurchasingService = Depends()):
    try:
        return service.create_purchasing(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create purchasing", error_detail=str(e))

@purchasing_router.put("/{purchasing_id}")
def update_purchasing_by_id(purchasing_id: int, request: PurchasingUpdate, service: PurchasingService = Depends()):
    try:
        return service.update_purchasing(purchasing_id, request)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update purchasing", error_detail=str(e))

@purchasing_router.delete("/{purchasing_id}")
def delete_purchasing_by_id(purchasing_id: int, service: PurchasingService = Depends()):
    try:
        return service.delete_purchasing(purchasing_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete purchasing", error_detail=str(e))