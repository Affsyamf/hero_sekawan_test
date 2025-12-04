# app/services/reporting/purchasing/purchasing_summary_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Product, Account, Purchasing, PurchasingDetail, ProductAvgCostCache, AccountParent
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class PurchasingSummaryService(BaseReportService):
    """
    Service for generating top-level Purchasing Summary KPIs.
    - Total Purchases
    - Total Goods / Services
    - Average Unit Cost
    - Highest Purchase Value
    - Top 5 Highest Avg Cost Products
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return self._get_summary(filters)

    # ------------------------------------------------------
    # internal summary logic
    # ------------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")
        account_type = filters.get("account_type")

        q = (
            db.query(
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn).label("total_value"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
            )
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
        )

        # Filters
        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        # if account_type and isinstance(account_type, AccountType):
        #     q = q.filter(Account.account_type == account_type.value)
       
        q = apply_common_report_filters(q, filters)

        total_row = q.one_or_none()
        total_value = float(total_row.total_value or 0) if total_row else 0
        total_qty = float(total_row.total_qty or 0) if total_row else 0
        avg_unit_cost = total_value / total_qty if total_qty else 0

        # --------------------------------------------------
        # Goods / Service split
        # --------------------------------------------------
        chemical_total = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn))
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .filter(AccountParent.account_type == "chemical")
        )
        sparepart_total = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn))
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .filter(AccountParent.account_type == "sparepart")
        )
        if start_date:
            chemical_total = chemical_total.filter(Purchasing.date >= start_date)
            sparepart_total = sparepart_total.filter(Purchasing.date >= start_date)
        if end_date:
            chemical_total = chemical_total.filter(Purchasing.date <= end_date)
            sparepart_total = sparepart_total.filter(Purchasing.date <= end_date)

        chemical_total = apply_common_report_filters(chemical_total, filters)
        sparepart_total = apply_common_report_filters(sparepart_total, filters)

        total_chemical = float(chemical_total.scalar() or 0)
        total_sparepart = float(sparepart_total.scalar() or 0)

        # --------------------------------------------------
        # Highest Purchase (by invoice total)
        # --------------------------------------------------
        highest_purchase_value = (
            db.query(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn))
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            
        ) or 0

        if start_date:
            highest_purchase_value = highest_purchase_value.filter(Purchasing.date >= start_date)
        if end_date:
            highest_purchase_value = highest_purchase_value.filter(Purchasing.date <= end_date)

        highest_purchase_value = (
            highest_purchase_value.group_by(Purchasing.id)
            .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn).desc())
            .limit(1)
            .scalar()
        )

        # --------------------------------------------------
        # Top 5 Highest Avg Cost Products
        # --------------------------------------------------
        top_avg_costs = (
            db.query(Product.name, ProductAvgCostCache.avg_cost)
            .join(ProductAvgCostCache, ProductAvgCostCache.product_id == Product.id)
            .order_by(ProductAvgCostCache.avg_cost.desc())
            .limit(5)
            .all()
        )
        top_avg_cost_products = [
            {"product": name, "avg_cost": float(avg or 0)} for name, avg in top_avg_costs
        ]

        return APIResponse.ok(
            meta=filters,
            data={
                "total_purchases": total_value,
                "total_chemical": total_chemical,
                "total_sparepart": total_sparepart,
                "avg_unit_cost": avg_unit_cost,
                "highest_purchase_value": float(highest_purchase_value or 0),
                "highest_avg_cost": top_avg_cost_products,
            }
        )
