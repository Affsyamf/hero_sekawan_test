from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.models import Sale, Client, ColorKitchenEntry, Design
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesClientTopResponse, ClientSalesData
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters
from app.utils.report import normalize_report_filters, sale_joins, date_filter, to_float
from app.services.reporting.base_reporting_service import BaseReportService
from datetime import date, datetime
from typing import List, Optional


class SalesClientTopService(BaseReportService):
    def __init__(self, db: Session = Depends(get_db)):
        super().__init__(db=db)
        
    def normalize_filters(self, filters_dict: dict) -> dict:
        return normalize_report_filters(filters_dict)
        
    def run(self, filters: SalesReportFilter):
        filters_dict = self.normalize_filters(filters.model_dump(exclude_none=False))
        return self.get_top(filters_dict)
    
    def get_top(self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")
        
        total_quantity_alias = func.sum(Sale.quantity_end).label("total_quantity")
        
        top_query = db.query(
            Client.id.label("client_id"),
            Client.name.label("client_name"),
            total_quantity_alias
        ).select_from(Sale)\
         .filter(Sale.deleted_at.is_(None))
         
        
        top_query = top_query.filter(Sale.opj_id.isnot(None)) 
        top_query = sale_joins(top_query)
        
        top_query = date_filter(top_query, start_date, end_date, Sale)
        
        top_query = apply_common_report_filters(top_query, filters)
        
        top_query = top_query.group_by(Client.id, Client.name)\
                             .order_by(desc(total_quantity_alias))
                             
        top_5_results = top_query.limit(5).all()
        
        results_list = [
            ClientSalesData(
                client_id=r.client_id,
                client_name=r.client_name,
                total_quantity=to_float(r.total_quantity or 0)
            )
            for r in top_5_results
        ]
        
        meta_response = {
            k: (v.isoformat() if isinstance(v, date) and v is not None else v)
            for k, v in filters.items() 
        }
        
        serialized_data_json = SalesClientTopResponse(
            results=results_list
        ).model_dump_json()
        
        return APIResponse.ok(
            meta=meta_response,
            data=serialized_data_json
        )