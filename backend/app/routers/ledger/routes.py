from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.ledger_input_models import LedgerCreate, LedgerUpdate
from app.utils.datatable.request import ListRequest
from app.services.ledger.ledger_service import LedgerService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_admin

ledger_router = APIRouter(prefix="/ledger", tags=["ledger"], dependencies=[Depends(require_admin())])

@ledger_router.get("/search")
def search_ledgers(request: ListRequest = Depends(), service: LedgerService = Depends()):
    return service.list_ledger(request=request)

@ledger_router.get("/{ledger_id}")
def get_ledger_by_id(ledger_id: int, service: LedgerService = Depends()):
    return service.get_ledger(ledger_id=ledger_id)

@ledger_router.post("/")
def create_ledger(request: LedgerCreate, service: LedgerService = Depends()):
    try:
        return service.create_ledger(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create ledger", error_detail=str(e))

@ledger_router.put("/{ledger_id}")
def update_ledger_by_id(ledger_id: int, request: LedgerUpdate, service: LedgerService = Depends()):
    try:
        return service.update_ledger(ledger_id, request)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update ledger", error_detail=str(e))

@ledger_router.delete("/{ledger_id}")
def delete_ledger_by_id(ledger_id: int, service: LedgerService = Depends()):
    try:
        return service.delete_ledger(ledger_id)
    # except HTTPException as e:
    #     return APIResponse(status_code=e.status_code, message=e.detail)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete ledger", error_detail=str(e))