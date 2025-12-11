from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.utils.deps import get_db
from app.schemas.filter_models.report_filters import PurchasingReportFilter
from app.services.reporting.overview.overview_summary_service import OverviewSummaryService
from typing import Optional
from app.dependencies.rbac import require_admin

router = APIRouter(prefix="/reports/overview", tags=["Reports/Overview"], dependencies=[require_admin()])

@router.post("/summary")
def get_ck_summary(filters: PurchasingReportFilter, db: Session = Depends(get_db)):
    return OverviewSummaryService(db).run(filters)