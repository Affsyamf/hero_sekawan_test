from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.master_input_models import SupplierCreate, SupplierUpdate
from app.utils.datatable.request import ListRequest
from app.services.master.supplier_service import SupplierService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

supplier_router = APIRouter(prefix="/supplier", tags=["supplier"], dependencies=[require_user()])

@supplier_router.get("/search")
def search_suppliers(request: ListRequest = Depends(), service: SupplierService = Depends()):
    return service.list_supplier(request=request)

@supplier_router.get("/color-kitchen")
def search_suppliers_ck(request: ListRequest = Depends(), service: SupplierService = Depends()):
    return service.list_supplier_ck(request=request)

@supplier_router.get("/{supplier_id}")
def get_supplier_by_id(supplier_id: int, service: SupplierService = Depends()):
    return service.get_supplier(supplier_id=supplier_id)

@supplier_router.post("/")
def create_supplier(request: SupplierCreate, service: SupplierService = Depends()):
    try:
        return service.create_supplier(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create supplier", error_detail=str(e))

@supplier_router.put("/{supplier_id}")
def update_supplier_by_id(supplier_id: int, request: SupplierUpdate, service: SupplierService = Depends()):
    try:
        return service.update_supplier(supplier_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update supplier", error_detail=str(e))

@supplier_router.delete("/{supplier_id}")
def delete_supplier_by_id(supplier_id: int, service: SupplierService = Depends()):
    try:
        return service.delete_supplier(supplier_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete supplier", error_detail=str(e))