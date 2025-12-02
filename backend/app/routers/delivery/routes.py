from fastapi import APIRouter, Depends, HTTPException

from app.schemas.input_models.deliveries_input_models import DeliveryCreate, DeliveryUpdate
from app.utils.datatable.request import ListRequest
from app.services.delivery.delivery_service import DeliveryService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

delivery_router = APIRouter(prefix="/delivery", tags=["delivery"], dependencies=[require_user()])


@delivery_router.get("/search")
def search_deliveries(service: DeliveryService = Depends()):
    return service.get_all_deliveries()


@delivery_router.get("/{delivery_id}")
def get_delivery_by_id(delivery_id: int, service: DeliveryService = Depends()):
    try:
        return service.get_delivery_by_id(delivery_id=delivery_id)
    except HTTPException as e:
        return APIResponse.error(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message=f"Failed to fetch delivery", error_detail=str(e))        

@delivery_router.post("/")
def create_delivery(request: DeliveryCreate, service: DeliveryService = Depends()):
    try:
        return service.create_delivery(payload=request)
    except HTTPException as e:
        return APIResponse.error(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create delivery", error_detail=str(e))

@delivery_router.put("/{delivery_id}")
def update_delivery(delivery_id: int, request: DeliveryUpdate, service: DeliveryService = Depends()):
    try:
        return service.update_delivery(delivery_id=delivery_id, payload=request)
    except HTTPException as e:
        return APIResponse.error(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update delivery", error_detail=str(e))

@delivery_router.delete("/{delivery_id}")
def delete_delivery(delivery_id: int, service: DeliveryService = Depends()):
    try:
        return service.soft_delete_delivery(delivery_id=delivery_id)
    except HTTPException as e:
        return APIResponse.error(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete delivery", error_detail=str(e))