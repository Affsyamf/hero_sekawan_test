# app/services/reporting/purchasing/purchasing_summary_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Product, Account, AccountParent, Purchasing, PurchasingDetail, ColorKitchenBatchDetail, ColorKitchenBatch, ColorKitchenEntryDetail, ColorKitchenEntry
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class OverviewSummaryService(BaseReportService):
    # ------------------------------------------------------
    # internal summary logic
    # ------------------------------------------------------
    def run(self, filters):
        filters = self.normalize_filters(filters)
        data = self._get_metrics(filters)
        return APIResponse.ok(meta=filters, data=data)

    # -------------------------------------------------
    # Master Summary Logic
    # -------------------------------------------------
    def _get_metrics(self, filters):
        db = self.db

        total_purchasing = self._calc_total_purchasing(db, filters)
        total_cost_produksi = self._calc_total_cost_produksi(db, filters)

        total_roll = self._count_total_roll(db, filters)
        avg_cost_per_roll = total_cost_produksi / total_roll if total_roll else 0

        return {
            "metrics": {
                "total_purchasing": {"value": total_purchasing, "trend": 0},
                "total_cost_produksi": {"value": total_cost_produksi, "trend": 0},
                "avg_cost_per_roll": {"value": avg_cost_per_roll, "trend": 0},
            },
            "most_used_dye": [],
            "most_used_aux": [],
        }

    # -------------------------------------------------
    # Real Queries per Domain
    # -------------------------------------------------
    def _calc_total_purchasing(self, db, filters):
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn))
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
        )
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
            
        q = apply_common_report_filters(q, filters)

        return float(q.scalar() or 0)

    def _calc_total_cost_produksi(self, db, filters):
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        # Combine Dyes (batch) + Aux (entry)
        q_dye = (
            db.query(func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used))
            .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
            .join(Product, Product.id == ColorKitchenBatchDetail.product_id)
            .join(Account, Account.id == Product.account_id)
        )
        q_aux = (
            db.query(func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used))
            .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
            .join(Product, Product.id == ColorKitchenEntryDetail.product_id)
            .join(Account, Account.id == Product.account_id)
        )
        if start_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date >= start_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q_dye = q_dye.filter(ColorKitchenBatch.date <= end_date)
            q_aux = q_aux.filter(ColorKitchenEntry.date <= end_date)

        q_dye = apply_common_report_filters(q_dye, filters)
        q_aux = apply_common_report_filters(q_aux, filters)
        

        total_dye = float(q_dye.scalar() or 0)
        total_aux = float(q_aux.scalar() or 0)
        return total_dye + total_aux

    def _count_total_roll(self, db, filters):
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = db.query(func.sum(ColorKitchenEntry.rolls))
        if start_date:
            q = q.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q = q.filter(ColorKitchenEntry.date <= end_date)
        
        q = apply_common_report_filters(q, filters)
        
        return int(q.scalar() or 0)