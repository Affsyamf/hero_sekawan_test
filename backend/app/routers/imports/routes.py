from fastapi import APIRouter, UploadFile, HTTPException, Depends, File
from typing import Type, Any
import inspect

from app.utils.deps import DB
from app.services.imports import (
    ColorKitchenImportService,
    LapPembelianImportService,
    OpeningBalanceImportService,
    StockOpnameChemicalImportService,
    LapChemicalImportService,
    MasterDataLapCkImportService,
    MasterDataLapChemicalImportService, 
    MasterDataLapPembelianImportService,
)
from app.dependencies.rbac import require_user

excel_import_router = APIRouter(prefix="/import", tags=["import"], dependencies=[require_user()])

# Excel import route factory
def make_import_routes(path: str, service_cls: Type[Any]):
    # --- Actual import route ---
    @excel_import_router.post(path)
    async def import_file(
        file: UploadFile = File(...),
        service: Any = Depends(service_cls),
    ):
        name = (file.filename or "").lower()
        if not name.endswith(".xlsx"):
            raise HTTPException(status_code=400, detail="Please upload an .xlsx file")

        try:
            if inspect.iscoroutinefunction(service._run):
                return await service._run(file)
            else:
                return service._run(file)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to import: {e}")

    # --- Preview route (if service implements preview) ---
    @excel_import_router.post(f"{path}/preview")
    async def preview_file(
        file: UploadFile = File(...),
        service: Any = Depends(service_cls),
    ):
        name = (file.filename or "").lower()
        if not name.endswith(".xlsx"):
            raise HTTPException(status_code=400, detail="Please upload an .xlsx file")

        if not hasattr(service, "preview"):
            raise HTTPException(status_code=404, detail="Preview not supported for this import type")

        try:
            if inspect.iscoroutinefunction(service.preview):
                return await service.preview(file)
            else:
                return service.preview(file)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to preview: {e}")

    return import_file, preview_file


# Route registration map
routes_map = {
    "/lap-chemical": LapChemicalImportService,
    "/lap-pembelian": LapPembelianImportService,
    "/lap-ck": ColorKitchenImportService,
    "/opening-balance": OpeningBalanceImportService,
    "/stock-opname-chemical": StockOpnameChemicalImportService,

    # Master Data imports
    "/master-data/lap-chemical": MasterDataLapChemicalImportService,
    "/master-data/lap-pembelian": MasterDataLapPembelianImportService,
    "/master-data/lap-ck": MasterDataLapCkImportService,
}

# Dynamically register all import routes
for path, service_cls in routes_map.items():
    make_import_routes(path, service_cls)