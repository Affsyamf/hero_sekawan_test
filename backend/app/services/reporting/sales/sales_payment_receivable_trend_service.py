from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import Optional
from app.core.database import get_db
from app.utils.response import APIResponse
from app.services.reporting.base_reporting_service import BaseReportService

from app.models import Sale, Payment, Opj
from app.schemas.filter_models.report_filters import SalesReportFilter

from app.utils.filters import apply_common_report_filters
from app.utils.report import sale_joins, to_float


class PaymentReceivableService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)

    def run(self, filters: SalesReportFilter):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_trend(filters),
        )

    def _get_trend(self, filters: dict):
        db: Session = self.db

        start_date: Optional[str] = filters.get("start_date")
        end_date: Optional[str] = filters.get("end_date")
        granularity = filters["granularity"]
        trunc_unit = filters["trunc_unit"]
        fmt = filters["date_format"]

        sales_period = func.date_trunc(trunc_unit, Sale.date).label("period")
        sales_sum = func.sum(Sale.quantity_start * Opj.unit_price + Sale.ppn - Sale.discount).label("total_sales")

        q_sales = (
            db.query(sales_period, sales_sum)
            .filter(Sale.deleted_at.is_(None))
        )

        q_sales = sale_joins(q_sales)
        q_sales = apply_common_report_filters(q_sales, filters)

        if start_date:
            q_sales = q_sales.filter(Sale.date >= start_date)
        if end_date:
            q_sales = q_sales.filter(Sale.date <= end_date)

        q_sales = q_sales.group_by(sales_period).order_by(sales_period)

        sales_rows = {
            r.period: to_float(r.total_sales or 0)
            for r in q_sales.all()
        }

        pay_period = func.date_trunc(trunc_unit, Payment.date).label("period")
        pay_sum = func.sum(Payment.amount).label("total_payment")

        q_pay = (
            db.query(pay_period, pay_sum)
            .join(Sale, Payment.sale_id == Sale.id)
        )

        q_pay = sale_joins(q_pay)
        q_pay = apply_common_report_filters(q_pay, filters)

        if start_date:
            q_pay = q_pay.filter(Payment.date >= start_date)
        if end_date:
            q_pay = q_pay.filter(Payment.date <= end_date)

        q_pay = q_pay.group_by(pay_period).order_by(pay_period)

        payment_rows = {
            r.period: to_float(r.total_payment or 0)
            for r in q_pay.all()
        }

        all_periods = sorted(set(sales_rows) | set(payment_rows))
        data = []

        for p in all_periods:
            sales_val = sales_rows.get(p, 0.0)
            pay_val = payment_rows.get(p, 0.0)
            receivable = sales_val - pay_val

            week_start = week_end = None
            if granularity == "weekly":
                week_start = p.date()
                week_end = week_start + timedelta(days=6)

            data.append({
                "period": p.strftime(fmt),
                "week_start": week_start.isoformat() if week_start else None,
                "week_end": week_end.isoformat() if week_end else None,
                "total_sales": round(sales_val, 2),
                "total_payment": round(pay_val, 2),
                "total_receivable": round(receivable, 2),
            })

        return data
