# app/services/reporting/purchasing/purchasing_product_insights_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import timedelta

from app.utils.response import APIResponse

from app.models import (
    Product,
    Purchasing,
    PurchasingDetail,
    StockMovementDetail,
    ProductAvgCostCache,
    Account,
    AccountParent,
    Supplier
)
from app.services.reporting.base_reporting_service import BaseReportService

from app.utils.filters import apply_common_report_filters

class PurchasingProductInsightsService(BaseReportService):
    """
    Service for product-level purchasing analytics.
    Includes:
      - Most purchased products
      - Rising cost products
      - Average unit cost per product
      - Purchase-to-consumption ratio
      - Highest average cost products
    """

    def run(self, filters):
        filters = self.normalize_filters(filters)
        return APIResponse.ok(
            meta=filters,
            data={
                "most_purchased": self._get_most_purchased(filters),
                # "rising_costs": self._get_rising_cost_products(filters),
                # "avg_unit_costs": self._get_avg_unit_cost_per_product(filters),
                # "purchase_to_consumption": self._get_purchase_to_consumption_ratio(filters),
                # "highest_avg_cost": self._get_highest_avg_cost_products(filters),
            }
        )

    # ------------------------------------------------------
    # Most Purchased Products (by quantity)
    # ------------------------------------------------------
    def _get_most_purchased(self, filters):
        db: Session = self.db
        start_date = filters.get("start_date")
        end_date = filters.get("end_date")

        q = (
            db.query(
                Product.name.label("product"),
                func.sum(PurchasingDetail.quantity).label("total_qty"),
                func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).label("total_value"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
        )

        if start_date:
            q = q.filter(Purchasing.date >= start_date)
        if end_date:
            q = q.filter(Purchasing.date <= end_date)

        q = apply_common_report_filters(q, filters)

        q = (
            q.group_by(Product.name)
            .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0)).desc())
            .limit(5)
        )

        q = q.all()

        return [
            {
                "product": r.product,
                "total_qty": float(r.total_qty or 0),
                "total_value": float(r.total_value or 0),
                "avg_cost": float(r.total_value or 0) / float(r.total_qty or 0) if r.total_qty > 0 else None
            }
            for r in q
        ]

    # ------------------------------------------------------
    # Top 5 Rising Cost Products
    # ------------------------------------------------------
    # def _get_rising_cost_products(self, filters):
    #     db: Session = self.db
    #     start_date = filters.get("start_date")
    #     end_date = filters.get("end_date")

    #     if not (start_date and end_date):
    #         return []  # Need both dates to compare periods

    #     # Split current vs previous period
    #     period_days = (end_date - start_date).days or 1
    #     prev_start = start_date - timedelta(days=period_days)
    #     prev_end = start_date

    #     # Current period average cost
    #     curr_q = (
    #         db.query(
    #             Product.id.label("product_id"),
    #             Product.name.label("product"),
    #             func.avg(PurchasingDetail.price).label("avg_cost_current"),
    #         )
    #         .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
    #         .filter(Purchasing.date >= start_date, Purchasing.date <= end_date)
    #         .group_by(Product.id, Product.name)
    #     ).subquery()

    #     # Previous period average cost
    #     prev_q = (
    #         db.query(
    #             Product.id.label("product_id"),
    #             func.avg(PurchasingDetail.price).label("avg_cost_previous"),
    #         )
    #         .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
    #         .filter(Purchasing.date >= prev_start, Purchasing.date <= prev_end)
    #         .group_by(Product.id)
    #     ).subquery()

    #     q = (
    #         db.query(
    #             curr_q.c.product,
    #             curr_q.c.avg_cost_current,
    #             prev_q.c.avg_cost_previous,
    #             (curr_q.c.avg_cost_current - func.coalesce(prev_q.c.avg_cost_previous, 0)).label("delta"),
    #         )
    #         .outerjoin(prev_q, prev_q.c.product_id == curr_q.c.product_id)
    #     )

    #     results = (
    #         q.order_by((curr_q.c.avg_cost_current - func.coalesce(prev_q.c.avg_cost_previous, 0)).desc())
    #         .limit(5)
    #         .all()
    #     )

    #     data = []
    #     for r in results:
    #         prev = float(r.avg_cost_previous or 0)
    #         curr = float(r.avg_cost_current or 0)
    #         pct = ((curr - prev) / prev * 100) if prev else None
    #         data.append({
    #             "product": r.product,
    #             "avg_cost_previous": prev,
    #             "avg_cost_current": curr,
    #             "delta": curr - prev,
    #             "percentage_change": round(pct, 2) if pct is not None else None,
    #         })
    #     return data

    # ------------------------------------------------------
    # Average Unit Cost per Product
    # ------------------------------------------------------
    # def _get_avg_unit_cost_per_product(self, filters):
    #     db: Session = self.db
    #     start_date = filters.get("start_date")
    #     end_date = filters.get("end_date")

    #     total_value = func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0))
    #     total_qty = func.sum(PurchasingDetail.quantity)

    #     q = (
    #         db.query(
    #             Product.name.label("product"),
    #             func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0) / PurchasingDetail.quantity).label("avg_unit_cost"),
    #         )
    #         .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
    #         .group_by(Product.name)
    #         .order_by(func.sum(PurchasingDetail.quantity * PurchasingDetail.price + PurchasingDetail.quantity * PurchasingDetail.ppn - func.coalesce(PurchasingDetail.pph, 0) / PurchasingDetail.quantity).desc())
    #         .filter(PurchasingDetail.quantity > 0)
    #     )
    #     if start_date:
    #         q = q.filter(Purchasing.date >= start_date)
    #     if end_date:
    #         q = q.filter(Purchasing.date <= end_date)

    #     return [
    #         {
    #             "product": r.product, 
    #             "avg_unit_cost": float(r.avg_unit_cost or 0),
    #         }
    #         for r in q.all()
    #     ]

    # ------------------------------------------------------
    # Purchase-to-Consumption Ratio
    # ------------------------------------------------------
    def _get_purchase_to_consumption_ratio(self, filters):
        db: Session = self.db

        # Total purchased per product
        purchased_q = (
            db.query(
                Product.id.label("product_id"),
                Product.name.label("product"),
                func.sum(PurchasingDetail.quantity).label("total_purchased"),
            )
            .join(Purchasing, Purchasing.id == PurchasingDetail.purchasing_id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
            .group_by(Product.id, Product.name)
        ).subquery()

        # Total consumed (from stock movements)
        consumed_q = (
            db.query(
                StockMovementDetail.product_id.label("product_id"),
                func.sum(StockMovementDetail.quantity).label("total_consumed"),
            )
            .group_by(StockMovementDetail.product_id)
        ).subquery()

        q = (
            db.query(
                purchased_q.c.product,
                purchased_q.c.total_purchased,
                func.coalesce(consumed_q.c.total_consumed, 0).label("total_consumed"),
                (purchased_q.c.total_purchased / func.nullif(consumed_q.c.total_consumed, 0)).label("ratio"),
            )
            .outerjoin(consumed_q, consumed_q.c.product_id == purchased_q.c.product_id)
        )

        q = apply_common_report_filters(q, filters)

        q = (
            q.order_by((purchased_q.c.total_purchased / func.nullif(consumed_q.c.total_consumed, 0)).desc())
            .limit(10)
        )

        q = q.all()
        return [
            {
                "product": r.product,
                "total_purchased": float(r.total_purchased or 0),
                "total_consumed": float(r.total_consumed or 0),
                "ratio": round(float(r.ratio or 0), 2) if r.ratio is not None else None,
            }
            for r in q
        ]

    # ------------------------------------------------------
    # Highest Average Cost Product
    # ------------------------------------------------------
    def _get_highest_avg_cost_products(self, filters):
        db: Session = self.db
        q = (
            db.query(Product.name, ProductAvgCostCache.avg_cost)
            .select_from(Product)
            .join(ProductAvgCostCache, ProductAvgCostCache.product_id == Product.id)
            .join(Account, Account.id == Product.account_id)
            .join(AccountParent, AccountParent.id == Account.parent_id)
            .join(Supplier, Supplier.id == Purchasing.supplier_id)
            .order_by(ProductAvgCostCache.avg_cost.desc())
        )

        q = apply_common_report_filters(q, filters)

        q = q.limit(5).all()

        return [
            {
                "product": name, 
                "avg_cost": float(avg or 0)
            }
            for name, avg in q
        ]
