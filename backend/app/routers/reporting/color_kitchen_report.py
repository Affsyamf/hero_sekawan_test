from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.utils.deps import get_db
from app.services.reporting.color_kitchen import (ColorKitchenSummaryService, ColorKitchenChemicalUsageService, ColorKitchenTrendService)
from app.schemas.filter_models.report_filters import ColorKitchenReportFilter
from typing import Optional
from app.dependencies.rbac import require_admin

router = APIRouter(prefix="/reports/color-kitchen", tags=["Reports/Color-Kitchen"], dependencies=[require_admin()])

@router.post("/summary")
def get_ck_summary(filters: ColorKitchenReportFilter, db: Session = Depends(get_db)):
    return ColorKitchenSummaryService(db).run(filters)

@router.post("/chemical-usage/summary")
def get_color_kitchen_chemical_summary(filters: ColorKitchenReportFilter, db: Session = Depends(get_db)):
    service = ColorKitchenChemicalUsageService(db)
    return service.run_summary(filters)

@router.post("/chemical-usage")
def get_color_kitchen_chemical_detail(
    filters: ColorKitchenReportFilter, 
    parent_type: str = Query("dye", enum=["dye", "aux"]),
    db: Session = Depends(get_db)
):
    service = ColorKitchenChemicalUsageService(db)
    return service.run_detailed(filters, parent_type)

@router.post("/trend")
def get_color_kitchen_trend(
    filters: ColorKitchenReportFilter,
    db: Session = Depends(get_db)
):
    service = ColorKitchenTrendService(db)
    return service.run(filters)