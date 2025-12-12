from fastapi import APIRouter, Depends

from app.schemas.input_models.sales_input_models import PaymentCreate, PaymentUpdate, PaymentResponse
from app.utils.datatable.request import ListRequest
from app.services.sales.payment_service import PaymentService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

payment_router = APIRouter(prefix="/payment", tags=["payment"], dependencies=[require_user()])

@payment_router.get("/search")
def search_payments(request: ListRequest = Depends(), service: PaymentService = Depends()):
    return service.list_payment(request=request)

@payment_router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_by_id(payment_id: int, service: PaymentService = Depends()):
    return service.get_payment(payment_id=payment_id)

@payment_router.post("/")
def create_payment(request: PaymentCreate, service: PaymentService = Depends()):
    try:
        return service.create_payment(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create payment", error_detail=str(e))

@payment_router.put("/{payment_id}")
def update_payment_by_id(payment_id: int, request: PaymentUpdate, service: PaymentService = Depends()):
    try:
        return service.update_payment(payment_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update payment", error_detail=str(e))

@payment_router.delete("/{payment_id}")
def delete_payment_by_id(payment_id: int, service: PaymentService = Depends()):
    try:
        return service.delete_payment(payment_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete payment", error_detail=str(e))
