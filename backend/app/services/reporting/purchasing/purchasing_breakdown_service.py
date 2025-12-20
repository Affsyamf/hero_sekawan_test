# app/services/reporting/purchasing/purchasing_breakdown_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

from app.models import Purchasing, PurchasingDetail, Product, Account, AccountParent
from app.services.reporting.base_reporting_service import BaseReportService


class PurchasingBreakdownService(BaseReportService):
    """
    Service for multi-level Purchasing Breakdown:
    account_type → goods/service
    account_name → within selected account_type
    product → within selected account
    """

    def run_summary(self, filters):
        filters = self.normalize_filters(filters)
        return self._get_summary(filters)

    def run_detailed(self, filters, level: str, parent_type: str = None, parent_account_id: int = None):
        filters = self.normalize_filters(filters)
        return self._get_detailed(filters, level, parent_type, parent_account_id)

    # --------------------------------------------------
    #  LEVEL 1 — Summary by account_type
    # --------------------------------------------------
    def _get_summary(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(
                AccountParent.account_type,
                func.coalesce(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)), 0).label("total_value"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
                
            )
            .select_from(PurchasingDetail)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
        )

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        q = apply_common_report_filters(q, filters)

        rows = q.group_by(AccountParent.account_type).all()

        data = []
        for r in rows:
            data.append({
                "label": r.account_type,
                "qty": float(r.total_qty or 0),
                "value": float(r.total_value or 0),
            })

        total = sum(d["value"] for d in data)
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return APIResponse.ok(
            meta={"level": "account_type", **filters},
            data=data
        )
    
    # --------------------------------------------------
    #  LEVEL 2–3 — Drilldown by account_type → account → product
    # --------------------------------------------------
    def _get_detailed(self, filters, level: str, parent_type: str = None, parent_account_id: int = None):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        if level == "account_type":
            # Drilldown: account_type → account_name
            q = (
                db.query(
                    AccountParent.account_no.label("account_no"),
                    Account.id.label("account_id"),
                    Account.name.label("account_name"),
                    func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).label("total_value"),
                    func.sum(PurchasingDetail.quantity).label("total_qty"),
                )
                .join(Product, Product.id == PurchasingDetail.product_id)
                .join(Account, Account.id == Product.account_id)
                .join(AccountParent, AccountParent.id == Account.parent_id)
                .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
                .filter(AccountParent.account_type == parent_type)
                .group_by(AccountParent.account_no, Account.id, Account.name)
                .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).desc())
            )

        elif level == "account":
            # Drilldown: account → product
            q = (
                db.query(
                    Product.name.label("product"),
                    func.sum(PurchasingDetail.quantity).label("total_qty"),
                    func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).label("total_value"),
                )
                .join(Product, Product.id == PurchasingDetail.product_id)
                .join(Account, Account.id == Product.account_id)
                .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
                .filter(Account.id == parent_account_id)
                .group_by(Product.name)
                .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).desc())
            )
        else:
            raise ValueError("Invalid level. Must be 'account_type' or 'account'.")

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        q = apply_common_report_filters(q, filters)

        rows = q.all()
        data = []

        if level == "account_type":
            # Aggregation by account (child of goods/service)
            data = [
                {
                    "account_id": int(r.account_id),
                    "label": r.account_name,
                    "qty": float(r.total_qty or 0),
                    "value": float(r.total_value or 0),
                }
                for r in rows
            ]
        else:  # level == "account"
            # Aggregation by product
            data = [
                {
                    "label": r.product,
                    "qty": float(r.total_qty or 0),
                    "value": float(r.total_value or 0),
                }
                for r in rows
            ]

        # Compute percentages
        total = sum(d["value"] for d in data)
        for d in data:
            d["percentage"] = round((d["value"] / total) * 100, 2) if total else 0.0

        return APIResponse.ok(
            meta={
                "level": level,
                "parent_type": parent_type,
                "parent_account_id": parent_account_id,
            },
            data=data
        ) 