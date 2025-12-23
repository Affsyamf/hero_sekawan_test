from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from typing import Optional
from app.core.database import get_db
from app.utils.response import APIResponse
from app.services.reporting.base_reporting_service import BaseReportService

from app.models import Sale, Payment, Opj, PurchasingDetail, Purchasing, Client
from app.schemas.filter_models.report_filters import SalesReportFilter

from app.utils.filters import apply_common_report_filters
from app.utils.report import sale_joins, to_float


class PurchasingSalesTrendService(BaseReportService):
    def __init__(self, db: Session =  Depends(get_db)):
        super().__init__(db=db)
        
    def run(self, filters: SalesReportFilter):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_trend(filters),
        )
        
    @staticmethod
    def growth(curr: float, prev: Optional[float]):
        if prev is None or prev == 0:
            return None
        return (curr - prev) / prev * 100
    
    def _get_trend(self, filters: dict):
        db: Session = self.db
        
        start_date: Optional[str] = filters.get("start_date")
        end_date: Optional[str] = filters.get("end_date")
        trunc_unit = filters["trunc_unit"]
        fmt = filters["date_format"]
        
        sales_period = func.date_trunc(trunc_unit, Sale.date).label("period")
        sales_sum = func.sum(Sale.quantity_start * Opj.unit_price + Sale.ppn - Sale.discount).label("total_sales")
        sales_qty = func.sum(Sale.quantity_end).label("total_qty")
        
        q_sales = (
            db.query(sales_period, sales_sum, sales_qty)
        )
        
        q_sales = sale_joins(q_sales)
        q_sales = apply_common_report_filters(q_sales, filters)
        
        if start_date:
            q_sales = q_sales.filter(Sale.date >= start_date)
        if end_date:
            q_sales = q_sales.filter(Sale.date <= end_date)
            
        q_sales = q_sales.group_by(sales_period).order_by(sales_period)
        
        sales_rows = {
            r.period: {"value": to_float(r.total_sales or 0), "qty": to_float(r.total_qty or 0),}
            for r in q_sales.all()
        }
        
        
        purchasing_period = func.date_trunc(trunc_unit, Purchasing.date).label("period")
        
        purchasing_sum = func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.discount, 0)).label("total_purchasing")
        
        purchasing_qty = func.sum(PurchasingDetail.quantity).label("total_qty")
        
        q_purchasing = (
            db.query(purchasing_period, purchasing_sum, purchasing_qty)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
        )
        
        # q_purchasing = sale_joins(q_purchasing)
        q_purchasing = apply_common_report_filters(q_purchasing, filters)        
        if start_date:
            q_purchasing = q_purchasing.filter(Purchasing.date >= start_date)
        if end_date:
            q_purchasing = q_purchasing.filter(Purchasing.date <= end_date)
            
        q_purchasing = q_purchasing.group_by(purchasing_period).order_by(purchasing_period)
        
        purchasing_rows = {
            r.period: { "value": to_float(r.total_purchasing or 0), "qty": to_float(r.total_qty or 0), }
            for r in q_purchasing.all()
        }
        
        all_periods = sorted(set(sales_rows) | set(purchasing_rows))
        
        result = []
        prev_sales = None
        prev_purchasing = None
        
        for p in all_periods:
            sales_val = sales_rows.get(p, {}).get("value", 0.0)
            sales_qty = sales_rows.get(p, {}).get("qty", 0.0)
            
            purchasing_val = purchasing_rows.get(p, {}).get("value", 0.0)
            purchasing_qty = purchasing_rows.get(p, {}).get("qty", 0.0)
            
            # bndingkan
            sales_growth = self.growth(sales_val, prev_sales)
            purchasing_growth = self.growth(purchasing_val, prev_purchasing)
            
            inventory_pressure_index = (
                purchasing_growth - sales_growth
                if sales_growth is not None and purchasing_growth is not None
                else None
            )
            
            result.append({
                "period": p.strftime(fmt),
                # "client_id": ,
                # "client_name": ,
                "total_sales": round(sales_val, 2),
                "sales_qty": round(sales_qty, 2),
                "total_purchasing": round(purchasing_val, 2),
                "purchasing_qty": round(purchasing_qty, 2),
                "sales_growth": round(sales_growth, 2) if sales_growth is not None else None,
                "purchasing_growth": round(purchasing_growth, 2) if purchasing_growth is not None else None,
                "inventory_pressure_index": round(inventory_pressure_index, 2) if inventory_pressure_index is not None else None,
            })
            
            prev_sales = sales_val
            prev_purchasing = purchasing_val
            
        return result