from sqlalchemy import exists, and_
from sqlalchemy.orm import Query

from app.models import (
    Product, Supplier, Purchasing, PurchasingDetail
)

class ColorKitchenReportBase:
    """
    Shared reusable logic for ALL Color Kitchen reporting services.
    Includes:
    - supplier filtering (via EXISTS subquery)
    - product-level filtering
    - helper to attach filters to a query safely
    """

    def apply_supplier_filter(self, q: Query, filters):
        """
        Apply supplier_ids filter using EXISTS without creating cross-joins.
        product_model MUST be the Product table used in this query.
        """

        supplier_ids = (filters or {}).get("supplier_ids")
        if not supplier_ids:
            return q

        return q.filter(
            exists().where(
                and_(
                    PurchasingDetail.product_id == Product.id,
                    Purchasing.id == PurchasingDetail.purchasing_id,
                    Supplier.id == Purchasing.supplier_id,
                    Supplier.id.in_(supplier_ids),
                )
            )
        )