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
        
        # normalize grannlarity | untuk menyamakan format, karna .lower hanya bisa dipakai di str
        granularity = filters_dict.get("granularity", "month")
        if isinstance(granularity, list):
            filters_dict["granularity"] = granularity[0] if granularity else "month"
        
        # convert int ke list pada sale_ids
        sale_ids_input = filters_dict.get("sale_ids")
        if isinstance(sale_ids_input, int):
            filters_dict["sale_ids"] = [sale_ids_input]
        return self.get_trend(filters_dict)
    
    def get_receivable(self, filters: dict) -> dict[str, float]:
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")
        
        granularity_raw = filters.get("granularity", "month").lower()
        PG_UNITS = {"day": "day", "days": "day", "week": "week", "month": "month", "year": "year"}
        granularity_pg = PG_UNITS.get(granularity_raw, "month")
        
        time_period_alias = func.date_trunc(granularity_pg, Sale.date).label("time_period")
        total_sales_proxy_alias = func.sum(Sale.quantity_end).label("total_sale_proxy")
        
        receivable_query = db.query(
            time_period_alias,
            total_sales_proxy_alias
        ).filter(Sale.deleted_at.is_(None))
        
        receivable_query = sale_joins(receivable_query)
        receivable_query = date_filter(receivable_query, start_date, end_date, Sale)
        receivable_query = apply_common_report_filters(receivable_query, filters)
        receivable_query = receivable_query.group_by(time_period_alias)\
                                           .order_by(time_period_alias.asc())
                                           
        return {
            r.time_period.isoformat(): to_float(r.total_sale_proxy or 0)
            for r in receivable_query.all()
        }  
        
    
    def get_trend(self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")
        
        granularity_raw = filters.get("granularity", "month").lower()
        PG_UNITS = {"day": "day", "days": "day", "week": "week", "month": "month", "year": "year"}
        granularity_pg = PG_UNITS.get(granularity_raw, "month")
            
        time_period_alias = func.date_trunc(granularity_pg, Payment.date).label("time_period")
        total_payment_alias = func.sum(Payment.amount).label("total_payment")
        
        payment_query = db.query(
            time_period_alias,
            total_payment_alias
        )
        
        payment_query = payment_query.join(Sale, Payment.sale_id == Sale.id)
        payment_query = sale_joins(payment_query)
        payment_query = date_filter(payment_query, start_date, end_date, Payment)
        payment_query = apply_common_report_filters(payment_query, filters)
        payment_query = payment_query.group_by(time_period_alias)\
                                 .order_by(time_period_alias.asc())
                                 
        results = payment_query.all()
        
        receivable_dict = self.get_receivable(filters)
        
        merged_data = {}
        
        for r in results:
            period_str = r.time_period.isoformat()
            merged_data[period_str] = {
                "time_period": period_str,
                "total_payment": to_float(r.total_payment or 0),
                "total_sale_amount": 0.0
            }
        
        for period_str, sale_amount_proxy in receivable_dict.items():
            if period_str in merged_data:
                merged_data[period_str]["total_sale_amount"] = sale_amount_proxy
            else:
                merged_data[period_str] = {
                    "time_period": period_str,
                    "total_payment": 0.0,
                    "total_sale_amount": sale_amount_proxy
                }
                
        sorted_results = sorted(
            merged_data.values(),
            key=lambda x: datetime.fromisoformat(x["time_period"])
        )
        
        results_list = [
            PaymentReceivableTrend(
                time_period=r['time_period'],
                total_payment=r['total_payment'],
                total_receivable = r['total_sale_amount'] - r['total_payment']
            )
            for r in sorted_results
        ]
        
        meta_response = {
            k: (v.isoformat() if isinstance(v, date) and v is not None else v)
            for k, v in filters.items()   
        }
        
        meta_response["granularity"] = granularity_pg
        
        if filters.get("sale_ids"):
            meta_response["sale_ids"] = filters["sale_ids"]
        elif filters.get("id"):
             meta_response["id"] = filters["id"]
             
        elif filters.get("sale_id"):
             meta_response["sale_id"] = filters["sale_id"]
        elif filters.get("id"):
             meta_response["id"] = filters["id"]
             
             
        searialized_data_json = PaymentReceivableResponse(
            results=results_list
        ).model_dump()
        
        return APIResponse.ok(
            meta=meta_response,
            data=searialized_data_json
        )