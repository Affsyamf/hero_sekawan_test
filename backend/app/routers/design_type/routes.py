from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.types_input_models import DesignTypeCreate, DesignTypeUpdate
from app.utils.datatable.request import ListRequest
from app.services.types.design_type_service import DesignTypeService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

design_type_router = APIRouter(prefix="/design-type", tags=["design-type"], dependencies=[require_user()])

@design_type_router.get("/search")
def search_design_types(request: ListRequest = Depends(), service: DesignTypeService = Depends()):
    return service.list_design_type(request=request)

@design_type_router.get("/{design_type_id}")
def get_design_type_by_id(design_type_id: int, service: DesignTypeService = Depends()):
    return service.get_design_type(design_type_id=design_type_id)

@design_type_router.post("/")
def create_design_type(request: DesignTypeCreate, service: DesignTypeService = Depends()):
    try:
        return service.create_design_type(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create design type", error_detail=str(e))

@design_type_router.put("/{design_type_id}")
def update_design_type_by_id(design_type_id: int, request: DesignTypeUpdate, service: DesignTypeService = Depends()):
    try:
        return service.update_design_type(design_type_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update design type", error_detail=str(e))

@design_type_router.delete("/{design_type_id}")
def delete_design_type_by_id(design_type_id: int, service: DesignTypeService = Depends()):
    try:
        return service.delete_design_type(design_type_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete design type", error_detail=str(e))