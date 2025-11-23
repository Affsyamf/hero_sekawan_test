from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.color_kitchen_input_models import ColorKitchenBatchCreate, ColorKitchenBatchUpdate
from app.utils.datatable.request import ListRequest
from app.services.color_kitchen.color_kitchen_batch_service import ColorKitchenBatchService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

color_kitchen_batch_router = APIRouter(prefix="/color-kitchen-batch", tags=["color-kitchen-batch"], dependencies=[require_user()])

@color_kitchen_batch_router.get("/search")
def search_color_kitchen_batches(request: ListRequest = Depends(), service: ColorKitchenBatchService = Depends()):
    return service.list_color_kitchen_batch(request=request)

@color_kitchen_batch_router.get("/{batch_id}")
def get_color_kitchen_batch_by_id(batch_id: int, service: ColorKitchenBatchService = Depends()):
    return service.get_color_kitchen_batch(batch_id=batch_id)

@color_kitchen_batch_router.post("/")
def create_color_kitchen_batch(request: ColorKitchenBatchCreate, service: ColorKitchenBatchService = Depends()):
    try:
        return service.create_color_kitchen_batch(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create color kitchen batch", error_detail=str(e))

@color_kitchen_batch_router.put("/{batch_id}")
def update_color_kitchen_batch_by_id(batch_id: int, request: ColorKitchenBatchUpdate, service: ColorKitchenBatchService = Depends()):
    try:
        return service.update_color_kitchen_batch(batch_id, request)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update color kitchen batch", error_detail=str(e))

@color_kitchen_batch_router.delete("/{batch_id}")
def delete_color_kitchen_batch_by_id(batch_id: int, service: ColorKitchenBatchService = Depends()):
    try:
        return service.delete_color_kitchen_batch(batch_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete color kitchen batch", error_detail=str(e))