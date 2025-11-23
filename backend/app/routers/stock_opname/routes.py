from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.stock_opname_input_models import StockOpnameCreate, StockOpnameUpdate
from app.utils.datatable.request import ListRequest
from app.services.stock_opname.stock_opname_service import StockOpnameService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

stock_opname_router = APIRouter(prefix="/stock-opname", tags=["stock-opname"], dependencies=[require_user()])

@stock_opname_router.get("/search")
def search_stock_opnames(request: ListRequest = Depends(), service: StockOpnameService = Depends()):
    return service.list_stock_opname(request=request)

@stock_opname_router.get("/{stock_opname_id}")
def get_stock_opname_by_id(stock_opname_id: int, service: StockOpnameService = Depends()):
    return service.get_stock_opname(stock_opname_id=stock_opname_id)

@stock_opname_router.post("/")
def create_stock_opname(request: StockOpnameCreate, service: StockOpnameService = Depends()):
    try:
        return service.create_stock_opname(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create stock opname", error_detail=str(e))

@stock_opname_router.put("/{stock_opname_id}")
def update_stock_opname_by_id(stock_opname_id: int, request: StockOpnameUpdate, service: StockOpnameService = Depends()):
    try:
        return service.update_stock_opname(stock_opname_id, request)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update stock opname", error_detail=str(e))

@stock_opname_router.delete("/{stock_opname_id}")
def delete_stock_opname_by_id(stock_opname_id: int, service: StockOpnameService = Depends()):
    try:
        return service.delete_stock_opname(stock_opname_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete stock opname", error_detail=str(e))