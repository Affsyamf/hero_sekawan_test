from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.utils.response import APIResponse
from app.services.reporting.base_reporting_service import BaseReportService
from typing import Optional
from datetime import timedelta

from app.models import Sale, Client
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesTrendResponse, SalesTrendData

from app.utils.filters import apply_common_report_filters
from app.utils.report import sale_joins, to_float



class SalesTrendService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)

    def run(self, filters: SalesReportFilter):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(meta=filters, data=self._get_trend(filters))

    def _get_trend(self, filters: dict):
        db: Session = self.db

        start_date: Optional[str] = filters.get("start_date")
        end_date: Optional[str] = filters.get("end_date")
        granularity = filters["granularity"]
        trunc_unit = filters["trunc_unit"]
        fmt = filters["date_format"]

        period_expr = func.date_trunc(trunc_unit, Sale.date).label("period")
        total_qty_expr = func.sum(Sale.quantity_end).label("total_quantity")

        query = (
            db.query(period_expr, Client.name, total_qty_expr)
        )

        query = sale_joins(query)
        query = apply_common_report_filters(query, filters)

        if start_date:
            query = query.filter(Sale.date >= start_date)
        if end_date:
            query = query.filter(Sale.date <= end_date)

        query = (
            query.group_by(period_expr, Client.name)
                 .order_by(period_expr, Client.name)
        )

        rows = query.all()
        period_map = {}

        for r in rows:
            p = r.period

            if p not in period_map:
                week_start = week_end = None
                if granularity == "weekly":
                    week_start = p.date()
                    week_end = week_start + timedelta(days=6)

                period_map[p] = {
                    "period": p.strftime(fmt),
                    "week_start": week_start.isoformat() if week_start else None,
                    "week_end": week_end.isoformat() if week_end else None,
                    "clients": [],
                    "total": 0.0,
                }

            qty = to_float(r.total_quantity or 0)

            period_map[p]["clients"].append({
                "name": r.name,
                "total": round(qty, 2),
            })

            period_map[p]["total"] += qty

        return list(period_map.values())
