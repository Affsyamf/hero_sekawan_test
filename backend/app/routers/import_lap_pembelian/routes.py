from fastapi import APIRouter, HTTPException, Depends, UploadFile, Query

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate
from app.utils.datatable.request import ListRequest
from app.services.types.account_service import AccountService
from app.utils.response import APIResponse
from app.services.import_lap_pembelian_service import ImportLapPembelianService
from app.dependencies.rbac import require_user

import_lap_pembelian_router = APIRouter(prefix="/import-lap-pembelian", tags=["Import Laporan Pembelian"], dependencies=[require_user()])

@import_lap_pembelian_router.post("/upload")
def upload_excel(file: UploadFile, service: ImportLapPembelianService = Depends()):
    return service.upload_excel(file)

@import_lap_pembelian_router.post("/commit/{session_id}")
def commit_data(session_id: str, service: ImportLapPembelianService = Depends()):
    return service.commit_data(session_id)

@import_lap_pembelian_router.get("/preview/{session_id}/summary")
def get_preview_summary( session_id: str, service: ImportLapPembelianService = Depends()):
    """Get summary of all table targets"""
    return service.get_preview_summary(session_id)

@import_lap_pembelian_router.get("/preview/{session_id}/{table_target}")
def get_preview(
    session_id: str,
    table_target: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    service: ImportLapPembelianService = Depends()
):
    """Get preview data by table_target with pagination"""
    return service.get_preview(session_id, table_target, page, per_page)