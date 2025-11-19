from fastapi import FastAPI, Request, HTTPException, Depends
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.utils.response import APIResponse

from app.events import audit_events, ledger_events, soft_delete_filter, prevent_bulk_ops
from app.models import *

from app.routers.dashboard.routes import dashboard_router as dashboard_router
from app.routers.product.routes import product_router
from app.routers.account_parent.routes import account_parent_router
from app.routers.account.routes import account_router
from app.routers.supplier.routes import supplier_router
from app.routers.design_type.routes import design_type_router
from app.routers.design.routes import design_router
from app.routers.purchasing.routes import purchasing_router
from app.routers.color_kitchen_batch.routes import color_kitchen_batch_router
from app.routers.color_kitchen_entry.routes import color_kitchen_entry_router
from app.routers.stock_movement.routes import stock_movement_router
from app.routers.stock_opname.routes import stock_opname_router
from app.routers.ledger.routes import ledger_router

from app.routers.imports.routes import excel_import_router
from app.routers.import_lap_pembelian.routes import import_lap_pembelian_router

from app.routers.reporting.purchasing_report import router as purchasing_report_router
from app.routers.reporting.color_kitchen_report import router as color_kitchen_report_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend dev server
    allow_credentials=True,
    allow_methods=["*"],   # allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],   # allow all headers
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

app.include_router(excel_import_router)
app.include_router(import_lap_pembelian_router)

app.include_router(purchasing_report_router)
app.include_router(color_kitchen_report_router)

app.include_router(product_router)
app.include_router(account_parent_router)
app.include_router(account_router)
app.include_router(supplier_router)
app.include_router(design_type_router)
app.include_router(design_router)

app.include_router(dashboard_router)

app.include_router(purchasing_router)
app.include_router(color_kitchen_batch_router)
app.include_router(color_kitchen_entry_router)
app.include_router(stock_movement_router)
app.include_router(stock_opname_router)
app.include_router(ledger_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Cek apakah error karena body kosong
    is_body_missing = any(
        err["loc"] == ("body",) and err["type"] == "missing"
        for err in exc.errors()
    )

    if is_body_missing:
        return APIResponse.bad_request(
            message="Request body is required"
        )

    # Default custom 422
    return APIResponse.validation_error(
        errors=[f"{'.'.join(map(str, err['loc']))}: {err['msg']}" for err in exc.errors()]
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return APIResponse(
        status_code=exc.status_code,
        message=exc.detail
    )()