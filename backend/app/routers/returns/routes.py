from fastapi import APIRouter, Depends

from app.schemas.input_models.sales_input_models import ReturnCreate, ReturnUpdate, ReturnResponse, ReturnFilter
from app.utils.datatable.request import ListRequest
from app.services.sales.return_service import ReturnService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

returns_router = APIRouter(
    prefix="/returns",
    tags=["returns"],
    dependencies=[require_user()]
)

@returns_router.post("/search", response_model=ReturnResponse )
def search_returns(filters: ReturnFilter, request: ListRequest = Depends(), service: ReturnService = Depends()):
    return service.list_return(request=request, filters=filters)

@returns_router.get("/{return_id}", response_model=ReturnResponse)
def get_return_by_id(return_id: int, service: ReturnService = Depends()):
    return service.get_return(return_id=return_id)

@returns_router.post("/", response_model=ReturnResponse)
def create_return(request: ReturnCreate, service: ReturnService = Depends()):
    try:
        return service.create_return(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create return", error_detail=str(e))

@returns_router.put("/{return_id}", response_model=ReturnResponse)
def update_return_by_id(return_id: int, request: ReturnUpdate, service: ReturnService = Depends()):
    try:
        return service.update_return(return_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update return", error_detail=str(e))

@returns_router.delete("/{return_id}")
def delete_return_by_id(return_id: int, service: ReturnService = Depends()):
    try:
        return service.delete_return(return_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete return", error_detail=str(e))
