# app/api/dahsboard/dashboard_route.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.services.dashboard.dashboard_service import DashboardService
from app.utils.datatable.request import ListRequest
from app.dependencies.rbac import require_admin

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(require_admin())])


@dashboard_router.post("/overview")
def get_dashboard_overview(
    request: ListRequest = Depends(),
    db: Session = Depends(get_db),  # ✅ ambil db session dengan Depends
):
    service = DashboardService(db)  # ✅ buat instance service secara manual
    return service.run(filters=request)

# @router.get("/overview")
# def get_dashboard_overview(
#     period: str = Query("1 Bulan", description="Period: '1 Bulan', '3 Bulan', '6 Bulan'"),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get production dashboard overview data
    
#     Returns:
#     - metrics: KPI cards (total_purchasing, total_stock_terpakai, total_cost_produksi, avg_cost_per_job)
#     - stock_flow: Time series for Stock Masuk vs Terpakai
#     - cost_trend: Time series for production cost
#     - most_used_dye: Top 5 most used dyes
#     - most_used_aux: Top 5 most used auxiliaries
#     """
#     service = DashboardService(db)
#     return service.get_dashboard_data(period)


# @router.get("/stock-location")
# def get_stock_by_location(db: Session = Depends(get_db)):
#     """
#     Get current stock distribution by location (Gudang, Kitchen, Usage)
#     Returns percentage distribution
#     """
#     service = DashboardService(db)
#     return service.get_stock_by_location()


# @router.get("/design-cost")
# def get_design_cost(
#     days: int = Query(30, description="Number of days to look back"),
#     limit: int = Query(5, description="Number of top designs to return"),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get production cost per design
#     Shows top designs by order count with their total cost
#     """
#     start_date = datetime.now() - timedelta(days=days)
#     service = DashboardService(db)
#     return service.get_design_cost(start_date, limit)


# @router.get("/transactions")
# def get_transactions(
    # page: int = Query(1, ge=1, description="Page number"),
    # page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    # product_id: Optional[int] = Query(None, description="Filter by product ID"),
    # ref_type: Optional[str] = Query(None, description="Filter by reference type"),
    # start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    # end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    # db: Session = Depends(get_db)
# ):
#     """
#     Get transaction history from Ledger with pagination and filters
#     """
#     service = DashboardService(db)
#     return service.get_transactions(
#         page=page,
#         page_size=page_size,
#         product_id=product_id,
#         ref_type=ref_type,
#         start_date=start_date,
#         end_date=end_date
#     )