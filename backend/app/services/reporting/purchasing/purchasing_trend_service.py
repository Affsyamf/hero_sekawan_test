# app/services/reporting/purchasing/purchasing_trend_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import timedelta
from app.models import Purchasing, PurchasingDetail, Product, Account, AccountParent
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class PurchasingTrendService(BaseReportService):
    """
    Service for generating Purchasing Trend data.
    Supports: daily, weekly, monthly, yearly granularity.
    Returns total + goods/service breakdown + week range.
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_trend(filters)
        )

    # ------------------------------------------------------
    # internal trend logic
    # ------------------------------------------------------
    def _get_trend(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        account_name = filters.get("account_name")
        granularity = filters["granularity"]
        trunc_unit = filters["trunc_unit"]
        fmt = filters["date_format"]

        period_expr = func.date_trunc(trunc_unit, Purchasing.date).label("period")

        # Compute category-based sums
        period_expr = func.date_trunc(trunc_unit, Purchasing.date).label("period")

        # Base query: sum by period + account name
        q = (
            db.query(
                period_expr.label("period"),
                AccountParent.account_type.label("account_type"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).label("total_value"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .group_by(period_expr, AccountParent.account_type)
            .order_by(period_expr, AccountParent.account_type)
        )

        # Filters
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        if account_name:
            q = q.filter(Account.name == account_name)

        q = apply_common_report_filters(q, filters)

        rows = q.all()

        # Transform results
        grouped = {}
        for r in rows:
            period_dt = r.period
            period_label = period_dt.strftime(fmt)
            week_start = week_end = None
            if granularity == "weekly":
                week_start = period_dt.date()
                week_end = week_start + timedelta(days=6)

            if period_label not in grouped:
                grouped[period_label] = {
                    "period": period_label,
                    "week_start": week_start.isoformat() if week_start else None,
                    "week_end": week_end.isoformat() if week_end else None,
                    "total_value": 0.0,
                    "total_qty": 0.0,
                    # "accounts": {},
                    # "total": 0.0,
                }

            val = float(r.total_value or 0)
            qty = float(r.total_qty or 0)
            
            key = r.account_type.capitalize()
            grouped[period_label][key] = {
                "value" : val,
                "qty" : qty
            }
            
            grouped[period_label]["total_value"] += val
            grouped[period_label]["total_qty"] += qty
            
            # grouped[period_label]["accounts"][r.account_name] = val
            # grouped[period_label][r.account_type.capitalize()] = val
            # grouped[period_label]["total"] += val

        # Convert to list
        data = list(grouped.values())

        return data
