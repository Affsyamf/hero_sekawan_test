from fastapi import APIRouter, Depends

from app.schemas.input_models.opj_input_models import (
    OpjCreate, OpjUpdate, OpjResponse
)
from app.services.opj.opj_service import OpjService
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

opj_router = APIRouter(
    prefix="/opj",
    tags=["opj"],
    dependencies=[require_user()]
)

@opj_router.get("/search")
def search_opj(request: ListRequest = Depends(), service: OpjService = Depends()):
    return service.list_opj(request)

@opj_router.get("/{opj_id}", response_model=OpjResponse)
def get_opj(opj_id: int, service: OpjService = Depends()):
    return service.get_opj(opj_id)

@opj_router.post("/")
def create_opj(request: OpjCreate, service: OpjService = Depends()):
    try:
        return service.create_opj(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create OPJ", error_detail=str(e))

@opj_router.put("/{opj_id}")
def update_opj(opj_id: int, request: OpjUpdate, service: OpjService = Depends()):
    try:
        return service.update_opj(opj_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update OPJ", error_detail=str(e))

@opj_router.delete("/{opj_id}")
def delete_opj(opj_id: int, service: OpjService = Depends()):
    try:
        return service.delete_opj(opj_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete OPJ", error_detail=str(e))
