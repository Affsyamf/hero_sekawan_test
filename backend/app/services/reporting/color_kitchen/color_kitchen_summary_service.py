# app/services/reporting/color_kitchen/color_kitchen_summary_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.models import (
    ColorKitchenBatch as CKBatch,
    ColorKitchenBatchDetail as CKBatchDetail,
    ColorKitchenEntry as CKEntry,
    ColorKitchenEntryDetail as CKEntryDetail,
    Product, Supplier, Purchasing, PurchasingDetail, Account
)
from app.services.reporting.base_reporting_service import BaseReportService
from app.services.reporting.color_kitchen.base_color_kitchen_service import ColorKitchenReportBase

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class ColorKitchenSummaryService(BaseReportService, ColorKitchenReportBase):
    """
    Service for generating top-level Color Kitchen Production KPIs.
    - Total Batches
    - Total Entries
    - Total Rolls Processed
    - Average Cost per Batch
    - Average Cost per Entry
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data=self._get_summary(filters)
        ) 

    # ------------------------------------------------------
    # internal summary logic
    # ------------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        chem_type = self.normalise_chemical_type_filter(filters)

        # ----------------------------------------------
        # Total rolls processed
        # ----------------------------------------------
        q_rolls = db.query(func.coalesce(func.sum(CKEntry.rolls), 0))
        if start_date:
            q_rolls = q_rolls.filter(CKEntry.date >= start_date)
        if end_date:
            q_rolls = q_rolls.filter(CKEntry.date <= end_date)

        q_rolls = apply_common_report_filters(q_rolls, filters)

        total_rolls_processed = q_rolls.scalar() or 0

        # ----------------------------------------------
        # Total cost (entries: aux)
        # ----------------------------------------------
        q_cost_entry = (
            db.query(
                func.coalesce(
                    func.sum(CKEntryDetail.quantity * func.coalesce(CKEntryDetail.unit_cost_used, 0.0)),
                    0.0,
                ).label("entry_cost")
            )
            .select_from(CKEntryDetail)
            .join(CKEntry, CKEntry.id == CKEntryDetail.color_kitchen_entry_id)
            .join(Product, Product.id == CKEntryDetail.product_id)
            .join(Account, Account.id == Product.account_id)
        )

        q_cost_entry = self.apply_supplier_filter(q_cost_entry, filters)

        if start_date:
            q_cost_entry = q_cost_entry.filter(CKEntry.date >= start_date)
        if end_date:
            q_cost_entry = q_cost_entry.filter(CKEntry.date <= end_date)

        q_cost_entry = apply_common_report_filters(q_cost_entry, filters)

        total_entry_cost = 0
        if chem_type in ("AUX", "BOTH"):
            total_entry_cost = q_cost_entry.scalar() or 0


        # ----------------------------------------------
        # Total cost (batches: dye)
        # ----------------------------------------------
        q_cost_batch = (
            db.query(
                func.coalesce(
                    func.sum(CKBatchDetail.quantity * func.coalesce(CKBatchDetail.unit_cost_used, 0.0)),
                    0.0,
                ).label("batch_cost")
            )
            .select_from(CKBatchDetail)
            .join(CKBatch, CKBatch.id == CKBatchDetail.batch_id)
            .join(Product, Product.id == CKBatchDetail.product_id)
            .join(Account, Account.id == Product.account_id)
        )

        q_cost_batch = self.apply_supplier_filter(q_cost_batch, filters)

        if start_date:
            q_cost_batch = q_cost_batch.filter(CKBatch.date >= start_date)
        if end_date:
            q_cost_batch = q_cost_batch.filter(CKBatch.date <= end_date)

        q_cost_batch = apply_common_report_filters(q_cost_batch, filters)
        
        total_batch_cost = 0
        if chem_type in ("DYE", "BOTH"):
            total_batch_cost = q_cost_batch.scalar() or 0

        # ----------------------------------------------
        # Combine
        # ----------------------------------------------
        total_cost = (total_entry_cost or 0) + (total_batch_cost or 0)
        if isinstance(total_cost, Decimal):
            total_cost = float(total_cost)

        # ----------------------------------------------
        # Derived averages
        # ----------------------------------------------
        avg_cost_per_roll = total_cost / total_rolls_processed if total_rolls_processed else 0

        # ----------------------------------------------
        # Final result
        # ----------------------------------------------
        return {
            "total_cost": round(total_cost, 2),
            "total_rolls_processed": int(total_rolls_processed),
            "avg_cost_per_roll": round(avg_cost_per_roll, 2),
        }
