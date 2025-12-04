from fastapi import APIRouter, Depends

from app.schemas.input_models.deliveries_input_models import DeliveryCreate, DeliveryUpdate, DeliveryResponse, DeliveryFilter
from app.utils.datatable.request import ListRequest
from app.services.delivery.delivery_service import DeliveryService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user


delivery_router = APIRouter(prefix="/delivery", tags=["delivery"], dependencies=[require_user()])


@delivery_router.get("/search")
def search_deliveries(request: ListRequest = Depends(), filters: DeliveryFilter = Depends(), service: DeliveryService = Depends()):
    return service.list_delivery(request=request, filters=filters)


@delivery_router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery_by_id(delivery_id: int, service: DeliveryService = Depends()):
    try:
        return service.get_delivery(delivery_id=delivery_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to fetch delivery", error_detail=str(e))


@delivery_router.post("/")
def create_delivery(request: DeliveryCreate, service: DeliveryService = Depends()):
    try:
        return service.create_delivery(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create delivery", error_detail=str(e))


@delivery_router.put("/{delivery_id}")
def update_delivery(delivery_id: int, request: DeliveryUpdate, service: DeliveryService = Depends()):
    try:
        return service.update_delivery(delivery_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update delivery", error_detail=str(e))


@delivery_router.delete("/{delivery_id}")
def delete_delivery_by_id(delivery_id: int, service: DeliveryService = Depends()):
    try:
        return service.delete_delivery(delivery_id)
    except Exception as e:
        print("ERROR CREATE DELIVERY:", e)
        return APIResponse.internal_error(message="Failed to delete delivery", error_detail=str(e))
