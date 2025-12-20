from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.utils.response import APIResponse
from app.services.reporting.base_reporting_service import BaseReportService
from datetime import date, datetime
from typing import List, Optional

from app.models import Sale, Client, Opj, Design
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesClientTopResponse, ClientSalesData

from app.utils.filters import apply_common_report_filters
from app.utils.report import normalize_report_filters, sale_joins, date_filter, to_float

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
        
        total_quantity_alias = func.sum(Sale.quantity_start * Opj.unit_price + Sale.ppn - Sale.discount).label("total_quantity")
        
        client = db.query(
            Client.id.label("client_id"),
            Client.name.label("client_name"),
            total_quantity_alias
        ).select_from(Sale)
         
        
        client = sale_joins(client)
        
        client = date_filter(client, start_date, end_date, Sale)
        
        client = apply_common_report_filters(client, filters)
        
        client = client.group_by(Client.id, Client.name)\
                             .order_by(desc(total_quantity_alias))
                             
        res = client.all()
        
        results_list = [
            ClientSalesData(
                id=r.client_id,
                name=r.client_name,
                value=to_float(r.total_quantity or 0)
            )
            for r in res
        ]
        
        return APIResponse.ok(
            meta="",
            data=[r.model_dump() for r in results_list]
        )