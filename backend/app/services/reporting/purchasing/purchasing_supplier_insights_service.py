# app/services/reporting/purchasing/purchasing_supplier_insights_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Purchasing, PurchasingDetail, Product, Supplier, Account, AccountParent
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class PurchasingSupplierInsightsService(BaseReportService):
    """
    Service for supplier-level purchasing analytics.
    Includes:
      - Top 5 Suppliers by total spend
      - Highest spending supplier + product combo
      - Unique supplier count
      - Supplier concentration ratio (top 3 %)
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data={
                "top_suppliers": self._get_top_suppliers(filters),
                "highest_spend_combo": self._get_highest_spend_combo(filters),
                "unique_supplier_count": self._get_unique_supplier_count(filters),
                "concentration_ratio": self._get_supplier_concentration(filters),
            }
        )

    # ------------------------------------------------------
    # Top 5 Suppliers (by total purchase value)
    # ------------------------------------------------------
    def _get_top_suppliers(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(
                Supplier.name.label("supplier"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).label("total_spent"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
        )

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)
        
        q = apply_common_report_filters(q, filters)

        q = (
            q.group_by(Supplier.id, Supplier.name)
            .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).desc())
            .limit(5)
        )

        results = q.all()
        total = sum(float(r.total_spent or 0) for r in results)

        return [
            {
                "supplier": r.supplier,
                "total_spent": float(r.total_spent or 0),
                "total_qty": float(r.total_qty or 0), 
                "percentage": round((float(r.total_spent or 0) / total) * 100, 2) if total else 0,
            }
            for r in results
        ]

    # ------------------------------------------------------
    # Top 5 Spending Supplier + Product Combo
    # ------------------------------------------------------
    def _get_highest_spend_combo(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(
                Supplier.name.label("supplier"),
                Product.name.label("product"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).label("total_value"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
        )

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        q = (
            q.group_by(Supplier.name, Product.name)
            .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).desc())
            .limit(5)
            .all()
        
        )

        return [
            {
                "supplier": r.supplier,
                "product": r.product,
                "total_value": float(r.total_value or 0),
                "total_qty": float(r.total_qty or 0),
            } for r in q
        ]

    # ------------------------------------------------------
    # Unique Supplier Count
    # ------------------------------------------------------
    def _get_unique_supplier_count(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = db.query(func.count(func.distinct(Purchasing.supplier_id)))

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        count = q.scalar() or 0
        return {"unique_suppliers": count}

    # ------------------------------------------------------
    # Supplier Concentration Ratio (Top 3)
    # ------------------------------------------------------
    def _get_supplier_concentration(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        base_q = (
            db.query(
                Supplier.name.label("supplier"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).label("total_spent"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .group_by(Supplier.id, Supplier.name)
            .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - (func.coalesce(PurchasingDetail.pph, 0) * PurchasingDetail.quantity)).desc())
            .filter(Supplier.name != "System Opening Balance")
        )

        if start_date:
            base_q = base_q.filter(Purchasing.date >= start_date)
        if end_date:
            base_q = base_q.filter(Purchasing.date <= end_date)

        results = base_q.all()
        if not results:
            return {"top_3_ratio": 0, "total_spent": 0}

        total_spent = sum(float(r.total_spent or 0) for r in results)
        top3_spent = sum(float(r.total_spent or 0) for r in results[:3])
        ratio = (top3_spent / total_spent * 100) if total_spent else 0

        return {
            "total_spent": round(total_spent, 2),
            "top_3_total": round(top3_spent, 2),
            "top_3_ratio": round(ratio, 2),
            "suppliers": [r.supplier for r in results[:3]]
        }
