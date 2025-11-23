from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.master_input_models import DesignCreate, DesignUpdate
from app.utils.datatable.request import ListRequest
from app.services.master.design_service import DesignService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

design_router = APIRouter(prefix="/design", tags=["design"], dependencies=[require_user()])

@design_router.get("/search")
def search_designs(request: ListRequest = Depends(), service: DesignService = Depends()):
    return service.list_design(request=request)

@design_router.get("/{design_id}")
def get_design_by_id(design_id: int, service: DesignService = Depends()):
    return service.get_design(design_id=design_id)

@design_router.post("/")
def create_design(request: DesignCreate, service: DesignService = Depends()):
    try:
        return service.create_design(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create design", error_detail=str(e))

@design_router.put("/{design_id}")
def update_design_by_id(design_id: int, request: DesignUpdate, service: DesignService = Depends()):
    try:
        return service.update_design(design_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update design", error_detail=str(e))

@design_router.delete("/{design_id}")
def delete_design_by_id(design_id: int, service: DesignService = Depends()):
    try:
        return service.delete_design(design_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete design", error_detail=str(e))