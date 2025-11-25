# backend/app/api/product/routes.py
from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.master_input_models import ProductCreate, ProductUpdate
from app.utils.datatable.request import ListRequest
from app.services.master.product_service import ProductService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user

product_router = APIRouter(prefix="/product", tags=["product"], dependencies=[require_user()])

@product_router.get("/search")
def search_products(request: ListRequest = Depends(), service: ProductService = Depends()):
    return service.list_product(request=request)

@product_router.get("/color-kitchen")
def search_products_ck(request: ListRequest = Depends(), service: ProductService = Depends()):
    return service.list_product_ck(request=request)

@product_router.get("/{product_id}")
def get_product_by_id(product_id: int, service: ProductService = Depends()):
    return service.get_product(product_id=product_id)

@product_router.post("/")
def create_product(request: ProductCreate, service: ProductService = Depends()):
    try:
        return service.create_product(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create product", error_detail=str(e))

@product_router.put("/{product_id}")
def update_product_by_id(product_id: int, request: ProductUpdate, service: ProductService = Depends()):
    try:
        return service.update_product(product_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update product", error_detail=str(e))

@product_router.delete("/{product_id}")
def delete_product_by_id(product_id: int, service: ProductService = Depends()):
    try:
        return service.delete_product(product_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete product", error_detail=str(e))