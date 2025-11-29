# app/services/reporting/dashboard/dashboard_service.py
from sqlalchemy import func
from datetime import datetime
from app.models import (
    Purchasing, PurchasingDetail, 
    StockMovement, StockMovementDetail,
    ColorKitchenEntry, ColorKitchenEntryDetail,
    ColorKitchenBatch, ColorKitchenBatchDetail,
)
from app.services.reporting.base_reporting_service import BaseReportService
from app.utils.response import APIResponse

class DashboardService(BaseReportService):
    """
    Unified dashboard summary for Production Overview
    (Purchasing, Stock, Color Kitchen)
    """
    
    def normalize_filters(self, filters):
        if not filters:
            return {}

        start = getattr(filters, "start_date", None)
        end = getattr(filters, "end_date", None)
        granularity = getattr(filters, "granularity", None)
        account_type = getattr(filters, "account_type", None)

        # ✅ make sure safe default
        return {
            "start_date": start.isoformat() if isinstance(start, datetime) else start,
            "end_date": end.isoformat() if isinstance(end, datetime) else end,
            "granularity": granularity or "monthly",
            "account_type": account_type,
        }

    def run(self, filters):
        filters = self.normalize_filters(filters)
        data = self._get_metrics(filters)
        return APIResponse.ok(meta=filters, data=data)

    # -------------------------------------------------
    # Master Summary Logic
    # -------------------------------------------------
    def _get_metrics(self, filters):
        db = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        total_purchasing = self._calc_total_purchasing(db, start_date, end_date)
        total_stock_terpakai = self._calc_total_stock_terpakai(db, start_date, end_date)
        total_cost_produksi = self._calc_total_cost_produksi(db, start_date, end_date)

        total_roll = self._count_total_roll(db, start_date, end_date)
        avg_cost_per_roll = total_cost_produksi / total_roll if total_roll else 0

        return {
            "metrics": {
                "total_purchasing": {"value": total_purchasing, "trend": 0},
                "total_stock_terpakai": {"value": total_stock_terpakai, "trend": 0},
                "total_cost_produksi": {"value": total_cost_produksi, "trend": 0},
                "avg_cost_per_roll": {"value": avg_cost_per_roll, "trend": 0},
            },
            "most_used_dye": [],
            "most_used_aux": [],
        }

    # -------------------------------------------------
    # Real Queries per Domain
    # -------------------------------------------------
    def _calc_total_purchasing(self, db, start_date, end_date):
        q = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price))
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
        )
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        return float(q.scalar() or 0)

    def _calc_total_stock_terpakai(self, db, start_date, end_date):
        q = (
            db.query(func.sum(StockMovementDetail.quantity * StockMovementDetail.unit_cost_used))
            .join(StockMovement, StockMovement.id == StockMovementDetail.stock_movement_id)
        )
        if start_date:
            q = q.filter(StockMovement.date >= start_date)
        if end_date:
            q = q.filter(StockMovement.date <= end_date)
        return float(q.scalar() or 0)

    def _calc_total_cost_produksi(self, db, start_date, end_date):
        # Combine Dyes (batch) + Aux (entry)
        q_dye = (
            db.query(func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used))
            .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
        )
        q_aux = (
            db.query(func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used))
            .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
        )
        if start_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date >= start_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date <= end_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date <= end_date)

        total_dye = float(q_dye.scalar() or 0)
        total_aux = float(q_aux.scalar() or 0)
        return total_dye + total_aux

    def _count_total_roll(self, db, start_date, end_date):
        q = db.query(func.sum(ColorKitchenEntry.rolls))
        if start_date:
            q = q.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q = q.filter(ColorKitchenEntry.date <= end_date)
        return int(q.scalar() or 0)