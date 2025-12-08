from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Numeric
from app.core.database import get_db
from app.models import Sale, Return, Payment, Client, ColorKitchenEntry, Design
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesSummaryResponse
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters
from app.services.reporting.base_reporting_service import BaseReportService
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any, List


DEFAULT_SALE_VALUE = Decimal(1)


# --- Helper function for joins ---
def _add_sale_related_joins(query):
    return (
        query.outerjoin(Client, Sale.client_id == Client.id)
             .outerjoin(ColorKitchenEntry, Sale.color_kitchen_id == ColorKitchenEntry.id)
             .outerjoin(Design, ColorKitchenEntry.design_id == Design.id)
    )


# --- Date filter helper ---
def _apply_date_filter(query, start_date: date, end_date: date, model: Any):
    date_col = getattr(model, "date", None)
    if not date_col:
        return query
    if start_date:
        query = query.filter(date_col >= start_date)
    if end_date:
        query = query.filter(date_col <= end_date)
    return query


# --- Decimal fix ---
def _to_float(v):
    return float(v) if isinstance(v, Decimal) else v


class SalesSummaryService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)

    def normalize_filters(self, filters_dict: dict) -> dict:
        cleaned_filters = {}
        for k, v in filters_dict.items():
            if k in ["start_date", "end_date"] and v is not None:
                if isinstance(v, datetime):
                    cleaned_filters[k] = v.date()
                elif isinstance(v, date):
                    cleaned_filters[k] = v
                else:
                    cleaned_filters[k] = v
            else:
                cleaned_filters[k] = v
        return cleaned_filters

    def run(self, filters: SalesReportFilter):
        filters_dict = self.normalize_filters(filters.model_dump(exclude_none=False))
        return self._get_summary(filters_dict)

    def _get_summary(self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")

        # ---------------------------------------------------------
        # 1. Total Sales Count
        # ---------------------------------------------------------
        sales_count_query = db.query(func.count(Sale.id)).filter(Sale.deleted_at.is_(None))
        sales_count_query = _add_sale_related_joins(sales_count_query)
        sales_count_query = _apply_date_filter(sales_count_query, start_date, end_date, Sale)
        sales_count_query = apply_common_report_filters(sales_count_query, filters)

        total_sales_count = sales_count_query.scalar() or 0

        # ---------------------------------------------------------
        # 2. Total Returns Count
        # ---------------------------------------------------------
        returns_count_query = db.query(func.count(Return.id)).filter(Return.deleted_at.is_(None))
        returns_count_query = returns_count_query.join(Sale, Return.sale_id == Sale.id)
        returns_count_query = _add_sale_related_joins(returns_count_query)
        returns_count_query = _apply_date_filter(returns_count_query, start_date, end_date, Return)
        returns_count_query = apply_common_report_filters(returns_count_query, filters)

        total_returns_count = returns_count_query.scalar() or 0

        # ---------------------------------------------------------
        # 3. Total Payments Value
        # ---------------------------------------------------------
        payments_query = db.query(func.sum(Payment.amount)).filter(Payment.deleted_at.is_(None))
        payments_query = payments_query.join(Sale, Payment.sale_id == Sale.id)
        payments_query = _add_sale_related_joins(payments_query)
        payments_query = _apply_date_filter(payments_query, start_date, end_date, Payment)
        payments_query = apply_common_report_filters(payments_query, filters)

        total_payments_value = _to_float(payments_query.scalar() or 0)

        # ---------------------------------------------------------
        # 4. Total Receivable Value (Piutang)
        # ---------------------------------------------------------
        sales_total_sq = db.query(
            Sale.id,
            cast(DEFAULT_SALE_VALUE, Numeric).label("sale_total")
        ).filter(Sale.deleted_at.is_(None)).subquery()

        payment_total_sq = db.query(
            Payment.sale_id,
            func.sum(Payment.amount).label("payment_total")
        ).filter(Payment.deleted_at.is_(None)).group_by(Payment.sale_id).subquery()

        receivable_query = db.query(
            func.sum(
                sales_total_sq.c.sale_total -
                func.coalesce(cast(payment_total_sq.c.payment_total, Numeric), 0)
            )
        ).select_from(sales_total_sq) \
         .outerjoin(payment_total_sq, sales_total_sq.c.id == payment_total_sq.c.sale_id)

        receivable_query = receivable_query.join(Sale, sales_total_sq.c.id == Sale.id)
        receivable_query = _add_sale_related_joins(receivable_query)
        receivable_query = _apply_date_filter(receivable_query, start_date, end_date, Sale)
        receivable_query = apply_common_report_filters(receivable_query, filters)

        total_receivable_value = _to_float(receivable_query.scalar() or 0)

        # ---------------------------------------------------------
        # 5. Serialize response
        # ---------------------------------------------------------
        meta_response = {
            k: (v.isoformat() if isinstance(v, date) and v is not None else v)
            for k, v in filters.items()
        }

        serialized_data = SalesSummaryResponse(
            total_sales=int(total_sales_count),
            total_returns=int(total_returns_count),
            total_payments=total_payments_value,
            total_receivable=total_receivable_value
        ).model_dump_json()

        return APIResponse.ok(meta=meta_response, data=serialized_data)
