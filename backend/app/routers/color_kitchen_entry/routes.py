from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.color_kitchen_input_models import ColorKitchenEntryCreate, ColorKitchenEntryUpdate, ColorKitchenEntryFilter
from app.utils.datatable.request import ListRequest
from app.services.color_kitchen.color_kitchen_entry_service import ColorKitchenEntryService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user
from app.models import Opj, ColorKitchenEntry
from app.utils.deps import get_db

color_kitchen_entry_router = APIRouter(prefix="/color-kitchen-entry", tags=["color-kitchen-entry"], dependencies=[require_user()])

@color_kitchen_entry_router.post("/search")
def search_color_kitchen_entries(filters: ColorKitchenEntryFilter, service: ColorKitchenEntryService = Depends()):
    return service.list_color_kitchen_entry(filters=filters)

@color_kitchen_entry_router.get("/{entry_id}")
def get_color_kitchen_entry_by_id(entry_id: int, service: ColorKitchenEntryService = Depends()):
    return service.get_color_kitchen_entry(entry_id=entry_id)

@color_kitchen_entry_router.post("/")
def create_color_kitchen_entry(request: ColorKitchenEntryCreate, db:Session = Depends(get_db), service: ColorKitchenEntryService = Depends()):
    try:
        opj = db.query(Opj).filter(Opj.id == request.opj_id).first()
        if not opj:
            raise HTTPException(status_code=404, detail="Opj Not Found")
        
        request.code = opj.code
        return service.create_color_kitchen_entry(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create color kitchen entry", error_detail=str(e))

@color_kitchen_entry_router.put("/{entry_id}")
def update_color_kitchen_entry_by_id(entry_id: int, request: ColorKitchenEntryUpdate, db:Session = Depends(get_db), service: ColorKitchenEntryService = Depends()):
    try:
        entry = db.query(ColorKitchenEntry).filter(ColorKitchenEntry.id == entry_id).first()
        if not entry:
            raise HTTPException(status_code=404, detail="CK Entry Not Found")
        
        opj = db.query(Opj).filter(Opj.id == request.opj_id).first()
        if not opj:
            raise HTTPException(status_code=404, detail="Opj Not Found")
        
        return service.update_color_kitchen_entry(entry_id, request, opj.code)
    
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update color kitchen entry", error_detail=str(e))

@color_kitchen_entry_router.delete("/{entry_id}")
def delete_color_kitchen_entry_by_id(entry_id: int, service: ColorKitchenEntryService = Depends()):
    try:
        return service.delete_color_kitchen_entry(entry_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete color kitchen entry", error_detail=str(e))