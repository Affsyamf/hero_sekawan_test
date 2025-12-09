from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.core.database import get_db
from app.models import Sale, Payment 
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import PaymentReceivableResponse, PaymentReceivableTrend
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters
from app.utils.report import normalize_report_filters, sale_joins, date_filter, to_float 
from app.services.reporting.base_reporting_service import BaseReportService
from datetime import date, datetime
from typing import Optional, Any


class PaymentReceivableService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)
        
    def normalize_filters(self, filters_dict: dict) -> dict:
        return normalize_report_filters(filters_dict)
    
    def run(self, filters: SalesReportFilter):
        filters_dict = self.normalize_filters(filters.model_dump(exclude_none=False))
        return self.get_trend(filters_dict)
    
    def get_trend(self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")
        
        granularity = filters.get("granularity", "month").lower()
        
        allowed_granularity = ["days", "week", "month", "year"]
        if granularity.lower() not in allowed_granularity:
            granularity = "month"
            
        time_period_alias = func.date_trunc(granularity, Payment.date).label("time_period")
        total_payment_alias = func.sum(Payment.amount).label("total_payment")
        
        trend_query = db.query(
            time_period_alias,
            total_payment_alias
        ).filter(Payment.deleted_at.is_(None))
        
        trend_query = trend_query.join(Sale, Payment.sale_id == Sale.id)
        trend_query = sale_joins(trend_query)
        trend_query = date_filter(trend_query, start_date, end_date, Payment)
        trend_query = apply_common_report_filters(trend_query, filters)
        trend_query = trend_query.group_by(time_period_alias)\
                                 .order_by(time_period_alias.asc())
                                 
        results = trend_query.all()
        
        # piutanv
        # total_receivable_trend = self._get_receivable_trend(filters)
        
        results_list = [
            PaymentReceivableTrend(
                time_period=r.time_period,
                total_payment=to_float(r.total_payment or 0),
                total_receivable = None
            )
            for r in results
        ]
        
        meta_response = {
            k: (v.isoformat() if isinstance(v, date) and v is not None else v)
            for k, v in filters.items()   
        }
        
        searialized_data_json = PaymentReceivableResponse(
            results=results_list
        ).model_dump_json()
        
        return APIResponse.ok(
            meta=meta_response,
            data=searialized_data_json
        )