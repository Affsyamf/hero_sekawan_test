from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.stock_movement_input_models import StockMovementCreate, StockMovementUpdate
from app.utils.datatable.request import ListRequest
from app.services.stock_movement.stock_movement_service import StockMovementService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

stock_movement_router = APIRouter(prefix="/stock-movement", tags=["stock-movement"], dependencies=[require_user()])

@stock_movement_router.get("/search")
def search_stock_movements(request: ListRequest = Depends(), service: StockMovementService = Depends()):
    return service.list_stock_movement(request=request)

@stock_movement_router.get("/{stock_movement_id}")
def get_stock_movement_by_id(stock_movement_id: int, service: StockMovementService = Depends()):
    return service.get_stock_movement(stock_movement_id=stock_movement_id)

@stock_movement_router.post("/")
def create_stock_movement(request: StockMovementCreate, service: StockMovementService = Depends()):
    try:
        return service.create_stock_movement(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create stock movement", error_detail=str(e))

@stock_movement_router.put("/{stock_movement_id}")
def update_stock_movement_by_id(stock_movement_id: int, request: StockMovementUpdate, service: StockMovementService = Depends()):
    try:
        return service.update_stock_movement(stock_movement_id, request)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update stock movement", error_detail=str(e))

@stock_movement_router.delete("/{stock_movement_id}")
def delete_stock_movement_by_id(stock_movement_id: int, service: StockMovementService = Depends()):
    try:
        return service.delete_stock_movement(stock_movement_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete stock movement", error_detail=str(e))