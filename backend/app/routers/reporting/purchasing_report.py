from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.utils.deps import get_db
from app.services.reporting.purchasing import (PurchasingSummaryService, PurchasingTrendService, PurchasingBreakdownService,
                                               PurchasingProductInsightsService, PurchasingSupplierInsightsService)
from app.schemas.filter_models.report_filters import PurchasingReportFilter
from typing import Optional
from app.dependencies.rbac import require_admin

router = APIRouter(prefix="/reports/purchasing", tags=["Reports/Purchasing"], dependencies=[Depends(require_admin())])

@router.post("/summary")
def get_purchasing_summary(filters: PurchasingReportFilter, db: Session = Depends(get_db)):
    return PurchasingSummaryService(db).run(filters)

@router.post("/trend")
def get_purchasing_trend(filters: PurchasingReportFilter, db: Session = Depends(get_db)):
    return PurchasingTrendService(db).run(filters)

@router.post("/breakdown/summary")
def get_purchasing_breakdown_summary(
    filters: PurchasingReportFilter,
    db: Session = Depends(get_db),
):
    """
    Returns top-level purchasing breakdown by account_type.
    Used for the first-level pie chart.
    """
    service = PurchasingBreakdownService(db)
    return service.run_summary(filters)

@router.post("/breakdown")
def get_purchasing_breakdown(
    filters: PurchasingReportFilter,
    level: str = Query("account_type", enum=["account_type", "account"]),
    parent_type: Optional[str] = None,
    parent_account_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Multi-level drilldown breakdown:
      level=account_type → returns account_name breakdown
      level=account → returns per-product breakdown
    """
    service = PurchasingBreakdownService(db)
    return service.run_detailed(filters, level, parent_type, parent_account_id)

@router.post("/products")
def get_purchasing_product_insights(
    filters: PurchasingReportFilter,
    db: Session = Depends(get_db),
):
    """
    Returns product-level purchasing insights.
    """
    service = PurchasingProductInsightsService(db)
    return service.run(filters)

@router.post("/suppliers")
def get_purchasing_supplier_insights(
    filters: PurchasingReportFilter,
    db: Session = Depends(get_db),
):
    """
    Returns supplier-level purchasing insights.
    """
    service = PurchasingSupplierInsightsService(db)
    return service.run(filters)
