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
from app.utils.report import sale_joins, date_filter, to_float, normalize_report_filters


class SalesSummaryService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)

    def normalize_filters(self, filters_dict: dict) -> dict:
        return normalize_report_filters (filters_dict)

    def run(self, filters: SalesReportFilter):
        filters_dict = self.normalize_filters(filters.model_dump(exclude_none=False))
        # convert int ke list pada sale_ids
        sale_ids_input = filters_dict.get("sale_ids")
        if isinstance(sale_ids_input, int):
            filters_dict["sale_ids"] = [sale_ids_input]
        return self.get_summary(filters_dict)

    def get_summary(self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")

        # sales SUM
        sales_sum_query = db.query(func.sum(Sale.quantity_end)).filter(Sale.deleted_at.is_(None))
        sales_sum_query = sale_joins(sales_sum_query)
        sales_sum_query = date_filter(sales_sum_query, start_date, end_date, Sale)
        sales_sum_query = apply_common_report_filters(sales_sum_query, filters)

        total_sales_quantity = sales_sum_query.scalar() or 0
        total_sales_quantity_float = to_float(total_sales_quantity)

        # return count
        returns_count_query = db.query(func.count(Return.id)).filter(Return.deleted_at.is_(None))
        returns_count_query = returns_count_query.join(Sale, Return.sale_id == Sale.id)
        returns_count_query = sale_joins(returns_count_query)
        returns_count_query = date_filter(returns_count_query, start_date, end_date, Return)
        returns_count_query = apply_common_report_filters(returns_count_query, filters)

        total_returns_count = returns_count_query.scalar() or 0

        # total payment value
        payments_query = db.query(func.sum(Payment.amount)).filter(Payment.deleted_at.is_(None))
        payments_query = payments_query.join(Sale, Payment.sale_id == Sale.id)
        payments_query = sale_joins(payments_query)
        payments_query = date_filter(payments_query, start_date, end_date, Payment)
        payments_query = apply_common_report_filters(payments_query, filters)

        total_payments_value = to_float(payments_query.scalar() or 0)

        
        # piutang
        receivable_sum_query = db.query(func.sum(Sale.quantity_end)).filter(Sale.deleted_at.is_(None))
        receivable_sum_query = sale_joins(receivable_sum_query)
        receivable_sum_query = date_filter(receivable_sum_query, start_date, end_date, Sale)
        receivable_sum_query = apply_common_report_filters(receivable_sum_query, filters)
        
        total_receivable_value = total_sales_quantity_float - total_payments_value
        

        # serial response
        meta_response = {}
        
        for k, v in filters.items():
            if v is None:
                meta_response[k] = None
            elif isinstance(v, date):
                meta_response[k] = v.isoformat()
            else:
                #pastikan selalu string tunggal dan disanitasi
                if k == 'granularity':
                    granularity_raw = str(v).lower()
                    PG_UNITS = {"day": "day", "days": "day", "week": "week", "month": "month", "year": "year"}
                    meta_response[k] = PG_UNITS.get(granularity_raw, "month") 
                
                #sale_ids: Pastikan dikembalikan sebagai list, jika perlu
                elif k == 'sale_ids':
                    if isinstance(v, int):
                         meta_response[k] = [v]
                    elif isinstance(v, str) and v.isdigit():
                         meta_response[k] = [int(v)]
                    else:
                        # Jika sudah list dari pydantic, atau list of string/int
                        meta_response[k] = v
                else:
                    meta_response[k] = v
                    

        serialized_data = SalesSummaryResponse(
            total_sales=int(total_sales_quantity),
            total_returns=int(total_returns_count),
            total_payments=float(total_payments_value),
            total_receivable=float(total_receivable_value)
        ).model_dump()

        return APIResponse.ok(meta=meta_response, data=serialized_data)
