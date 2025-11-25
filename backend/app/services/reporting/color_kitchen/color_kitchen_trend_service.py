from sqlalchemy.orm import Session
from sqlalchemy import func, exists, and_
from datetime import timedelta
from app.models import (
    ColorKitchenBatch as CKBatch,
    ColorKitchenBatchDetail as CKBatchDetail,
    ColorKitchenEntry as CKEntry,
    ColorKitchenEntryDetail as CKEntryDetail,
    Product, Supplier, Purchasing, PurchasingDetail
)
from app.services.reporting.base_reporting_service import BaseReportService
from app.services.reporting.color_kitchen.base_color_kitchen_service import ColorKitchenReportBase

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class ColorKitchenTrendService(BaseReportService, ColorKitchenReportBase):
    """
    Service for generating Color Kitchen production trend data.
    Supports: daily, weekly, monthly, yearly granularity.
    Splits total cost into Dyes (from BatchDetail) and Auxiliaries (from EntryDetail).
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(meta=filters, data=self._get_trend(filters))

    # ------------------------------------------------------
    # internal trend logic
    # ------------------------------------------------------
    def _get_trend(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        granularity = (filters.get("granularity") or "monthly").lower()
        chem_type = self.normalise_chemical_type_filter(filters)

        # Determine SQL trunc unit & label format
        if granularity == "yearly":
            trunc_unit = "year"
            fmt = "%Y"
        elif granularity == "weekly":
            trunc_unit = "week"
            fmt = "%Y-W%W"
        elif granularity == "daily":
            trunc_unit = "day"
            fmt = "%Y-%m-%d"
        else:
            trunc_unit = "month"
            fmt = "%Y-%m"

        period_expr = func.date_trunc(trunc_unit, CKBatch.date).label("period")

        # -----------------------------
        # DYES — from BatchDetail
        # -----------------------------
        q_dyes = (
            db.query(
                period_expr,
                func.coalesce(
                    func.sum(CKBatchDetail.quantity * func.coalesce(CKBatchDetail.unit_cost_used, 0.0)), 0.0
                ).label("dyes_value"),
            )
            .join(CKBatch, CKBatch.id == CKBatchDetail.batch_id)
            .join(Product, Product.id == CKBatchDetail.product_id)
        )

        q_dyes = self.apply_supplier_filter(q_dyes, filters)

        if start_date:
            q_dyes = q_dyes.filter(CKBatch.date >= start_date)
        if end_date:
            q_dyes = q_dyes.filter(CKBatch.date <= end_date)

        q_dyes = q_dyes.group_by(period_expr)\
            .order_by(period_expr)

        q_dyes = apply_common_report_filters(q_dyes, filters)

        dyes_rows = {}
        if chem_type in ("DYE", "BOTH"):
            dyes_rows = {r.period: float(r.dyes_value or 0) for r in q_dyes.all()}
        
        # -----------------------------
        # AUXILIARIES — from EntryDetail
        # -----------------------------
        q_aux = (
            db.query(
                func.date_trunc(trunc_unit, CKEntry.date).label("period"),
                func.coalesce(
                    func.sum(CKEntryDetail.quantity * func.coalesce(CKEntryDetail.unit_cost_used, 0.0)), 0.0
                ).label("aux_value"),
            )
            .select_from(CKEntryDetail)
            .join(CKEntry, CKEntry.id == CKEntryDetail.color_kitchen_entry_id)
            .join(Product, Product.id == CKEntryDetail.product_id)
        )

        q_aux = self.apply_supplier_filter(q_aux, filters)

        if start_date:
            q_aux = q_aux.filter(CKEntry.date >= start_date)
        if end_date:
            q_aux = q_aux.filter(CKEntry.date <= end_date)

        q_aux = apply_common_report_filters(q_aux, filters)

        q_aux = (
            q_aux.group_by(func.date_trunc(trunc_unit, CKEntry.date))
                .order_by(func.date_trunc(trunc_unit, CKEntry.date))
        )
        
        aux_rows = {}
        if chem_type in ("AUX", "BOTH"):
            aux_rows = {r.period: float(r.aux_value or 0) for r in q_aux.all()}

        # -----------------------------
        # Merge results by period
        # -----------------------------
        all_periods = sorted(set(dyes_rows.keys()) | set(aux_rows.keys()))
        data = []

        for p in all_periods:
            dyes_val = dyes_rows.get(p, 0.0)
            aux_val = aux_rows.get(p, 0.0)
            total_val = dyes_val + aux_val

            week_start = week_end = None
            if granularity == "weekly":
                week_start = p.date()
                week_end = week_start + timedelta(days=6)

            data.append({
                "period": p.strftime(fmt),
                "week_start": week_start.isoformat() if week_start else None,
                "week_end": week_end.isoformat() if week_end else None,
                "dyes": round(dyes_val, 2),
                "auxiliaries": round(aux_val, 2),
                "total": round(total_val, 2),
            })

        return data
