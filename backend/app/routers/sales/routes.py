from fastapi import APIRouter, Depends

from app.schemas.input_models.sales_input_models import SalesCreate, SalesUpdate, SalesResponse, SalesFilter
from app.utils.datatable.request import ListRequest
from app.services.sales.sale_service import SalesService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

sales_router = APIRouter(
    prefix="/sales",
    tags=["sales"],
    dependencies=[require_user()]
)

@sales_router.post("/search")
def search_sales(filters: SalesFilter, request: ListRequest = Depends(), service: SalesService = Depends()):
    return service.list_sale(request=request, filters=filters)

@sales_router.get("/{sale_id}", response_model=SalesResponse)
def get_sale_by_id(sale_id: int, service: SalesService = Depends()):
    return service.get_sale(sale_id=sale_id)

@sales_router.post("/")
def create_sale(request: SalesCreate, service: SalesService = Depends()):
    try:
        return service.create_sale(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create sale", error_detail=str(e))

@sales_router.put("/{sale_id}")
def update_sale_by_id(sale_id: int, request: SalesUpdate, service: SalesService = Depends()):
    try:
        return service.update_sale(sale_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update sale", error_detail=str(e))

@sales_router.delete("/{sale_id}")
def delete_sale_by_id(sale_id: int, service: SalesService = Depends()):
    try:
        return service.delete_sale(sale_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete sale", error_detail=str(e))