# app/services/reporting/color_kitchen/color_kitchen_chemical_usage_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, exists, and_
from app.models import (
    ColorKitchenBatch,
    ColorKitchenBatchDetail,
    ColorKitchenEntry,
    ColorKitchenEntryDetail,
    Product, Supplier, Purchasing, PurchasingDetail
)
from app.services.reporting.base_reporting_service import BaseReportService
from app.services.reporting.color_kitchen.base_color_kitchen_service import ColorKitchenReportBase

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class ColorKitchenChemicalUsageService(BaseReportService, ColorKitchenReportBase):
    """
    Service for Color Kitchen Chemical Usage metrics.
    Includes summary and drilldown structure:
      - Level 1: Type (Dyes vs Aux)
      - Level 2: Product breakdown within selected type
    """

    def run_summary(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_summary(filters)
        ) 

    def run_detailed(self, filters, parent_type: str = None):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_detailed(filters, parent_type)
        ) 

    # ------------------------------------------------------------------
    #  LEVEL 1 — SUMMARY (Dyes vs Aux)
    # ------------------------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        chem_type = self.normalise_chemical_type_filter(filters)

        # --- Dyes (from BatchDetail)
        q_dyes = (
            db.query(
                func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used).label("value")
            )
            .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
            .join(Product, Product.id == ColorKitchenBatchDetail.product_id)
        )

        q_dyes = self.apply_supplier_filter(q_dyes, filters)

        if start_date:
            q_dyes = q_dyes.filter(ColorKitchenBatch.date >= start_date)
        if end_date:
            q_dyes = q_dyes.filter(ColorKitchenBatch.date <= end_date)

        q_dyes = apply_common_report_filters(q_dyes, filters)

        dyes_total = 0
        if chem_type in ("DYE", "BOTH"):
            dyes_total = float(q_dyes.scalar() or 0)

        # --- Auxiliaries (from EntryDetail)
        q_aux = (
            db.query(
                func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used).label("value")
            )
            .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
            .join(Product, Product.id == ColorKitchenEntryDetail.product_id)
        )

        q_aux = self.apply_supplier_filter(q_aux, filters)

        if start_date:
            q_aux = q_aux.filter(ColorKitchenEntry.date >= start_date)
        if end_date:
            q_aux = q_aux.filter(ColorKitchenEntry.date <= end_date)

        q_aux = apply_common_report_filters(q_aux, filters)

        aux_total = 0
        if chem_type in ("AUX", "BOTH"):
            aux_total = float(q_aux.scalar() or 0)

        # --- Combine results for Pie Chart
        data = [
            {"label": "Dyes", "value": round(dyes_total, 2)},
            {"label": "Auxiliaries", "value": round(aux_total, 2)},
        ]
        total = dyes_total + aux_total
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return {
            "level": "chemical_type",
            "data": data,
        }

    # ------------------------------------------------------------------
    #  LEVEL 2 — DRILLDOWN (Products within selected type)
    # ------------------------------------------------------------------
    def _get_detailed(self, filters, parent_type: str):
        """
        Drilldown by chemical type ("DYE" or "AUX")
        Returns top 5 products by total cost within that type.
        """
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if parent_type.upper() == "DYE":
            q = (
                db.query(
                    Product.name.label("product"),
                    func.sum(ColorKitchenBatchDetail.quantity).label("total_qty"),
                    func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used).label(
                        "total_value"
                    ),
                )
                .join(Product, Product.id == ColorKitchenBatchDetail.product_id)
                .join(ColorKitchenBatch, ColorKitchenBatch.id == ColorKitchenBatchDetail.batch_id)
            )

            q = self.apply_supplier_filter(q, filters)


            if start_date:
                q = q.filter(ColorKitchenBatch.date >= start_date)
            if end_date:
                q = q.filter(ColorKitchenBatch.date <= end_date)

            q = apply_common_report_filters(q, filters)

            q = (
                q.group_by(Product.name)
                .order_by(func.sum(ColorKitchenBatchDetail.quantity * ColorKitchenBatchDetail.unit_cost_used).desc())
            )

        elif parent_type.upper() == "AUX":
            q = (
                db.query(
                    Product.name.label("product"),
                    func.sum(ColorKitchenEntryDetail.quantity).label("total_qty"),
                    func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used).label(
                        "total_value"
                    ),
                )
                .join(Product, Product.id == ColorKitchenEntryDetail.product_id)
                .join(ColorKitchenEntry, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
            )

            q = self.apply_supplier_filter(q, filters)

            if start_date:
                q = q.filter(ColorKitchenEntry.date >= start_date)
            if end_date:
                q = q.filter(ColorKitchenEntry.date <= end_date)

            q = apply_common_report_filters(q, filters)

            q = (
                q.group_by(Product.name)
                .order_by(func.sum(ColorKitchenEntryDetail.quantity * ColorKitchenEntryDetail.unit_cost_used).desc())
            )
        else:
            raise ValueError("Invalid parent_type: must be 'DYE' or 'AUX'.")

        rows = q.all()
        data = [
            {
                "label": r.product,
                "qty": float(r.total_qty or 0),
                "value": float(r.total_value or 0),
            }
            for r in rows
        ]
        total = sum(d["value"] for d in data)
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return {"level": "product", "parent_type": parent_type, "data": data}
