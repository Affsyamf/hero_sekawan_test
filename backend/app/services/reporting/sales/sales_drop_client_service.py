from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.utils.response import APIResponse
from app.services.reporting.base_reporting_service import BaseReportService
from datetime import date, datetime
from typing import List, Optional, Dict

from app.models import Sale, Client, Opj, Design
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesClientTopResponse, ClientSalesData

from app.utils.filters import apply_common_report_filters
from app.utils.report import normalize_report_filters, sale_joins, date_filter, to_float
from collections import defaultdict

class SalesDropClientService(BaseReportService):
    
    def __init__(self, db: Session =  Depends(get_db)):
        super().__init__(db=db)
    
    def run (self, filters: SalesReportFilter):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta = filters,
            data = self.get_sales_down(filters),
        )
        
    def get_sales_down (self, filters: dict):
        db: Session = self.db
        start_date: Optional[date] = filters.get("start_date")
        end_date: Optional[date] = filters.get("end_date")
        trunc_unit = filters["trunc_unit"]
        fmt = filters["date_format"]
        period = func.date_trunc(trunc_unit, Sale.date).label("period")
        
        total_sales = func.sum(Sale.quantity_start * Opj.unit_price + Sale.ppn - Sale.discount).label("total_sales")
        total_qty = func.sum(Sale.quantity_end).label("total_qty")
        
        q = (
            db.query(
                Sale.client_id.label("client_id"),
                Client.name.label("client_name"),
                period,
                total_sales,
                total_qty
            )
        )
        
        q = sale_joins(q)
        q = apply_common_report_filters(q, filters)
        
        if start_date:
            q = q.filter(Sale.date >= start_date)
        if end_date:
            q = q.filter(Sale.date <= end_date)
            
        q = (
            q.group_by(Sale.client_id, Client.name, period).order_by(Sale.client_id, period)
        )
        
        rows = q.all()
        
        grouped: Dict[int, List] = defaultdict(list)
        for r in rows:
            grouped[r.client_id].append(r)
            
        
        result = []
        
        for client_id, client_rows in grouped.items():
            prev_sales = None
            
            for r in client_rows:
                curr_sales = to_float(r.total_sales or 0)
                
                if prev_sales is None or prev_sales == 0:
                    growth = None
                else: 
                    growth = (curr_sales - prev_sales) / prev_sales * 100
                    
                
                if growth is not None and growth < -5:
                    result.append({
                        "client_id": client_id,
                        "client_name": r.client_name,
                        "period": r.period.strftime(fmt),
                        "total_sales": round(curr_sales,2),
                        "total_qty": round(to_float(r.total_qty or 0),2),
                        "prev_sales": round(prev_sales, 2),
                        "growth": round(growth, 2),
                    })
                    
                prev_sales = curr_sales
                
        return result
        