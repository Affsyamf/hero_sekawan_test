# backend/app/services/master/product_service.py
from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.master_input_models import ProductCreate, ProductUpdate, ProductFilter
from app.core.database import Session, get_db
from app.models import (
    Product, PurchasingDetail, StockMovementDetail, 
    ColorKitchenEntryDetail, Ledger, StockOpnameDetail,
    Account, ColorKitchenBatch, ColorKitchenBatchDetail,
    AccountParent, Purchasing
)
from app.models.enum.ledger_enum import LedgerLocation
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters


class ProductService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_product(self, request: ListRequest, filters: ProductFilter):
        # === Base product query ===
        product_query = (
            self.db.query(Product)
            .outerjoin(Account)
            .options(joinedload(Product.account))
            .join(AccountParent, Account.parent_id == AccountParent.id)
        )
        
        supplier_join = filters.supplier_ids is not None and len(filters.supplier_ids) > 0
        
        if supplier_join:
            product_query = product_query.join(
                PurchasingDetail, Product.id == PurchasingDetail.product_id
            )
            
            product_query = product_query.join(
                Purchasing, PurchasingDetail.purchasing_id == Purchasing.id
            )
        
        product_query = apply_common_report_filters(product_query, filters)

        # === Filter (search) ===
        if request.q:
            like = f"%{request.q}%"
            product_query = product_query.filter(
                or_(
                    Product.code.ilike(like),
                    Product.name.ilike(like),
                    Product.unit.ilike(like),
                    Account.name.ilike(like),
                    Purchasing.supplier.name.ilike(like),
                )
            )

        # === Sorting ===
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Product, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            product_query = product_query.order_by(sort_col)
        else:
            product_query = product_query.order_by(Product.id)

        # === Subquery: aggregate ledger per product per location ===
        ledger_subq = (
            self.db.query(
                Ledger.product_id.label("product_id"),
                func.sum(Ledger.quantity_in - Ledger.quantity_out).label("stock_qty"),
            )
            .filter(Ledger.location == LedgerLocation.Gudang)
            .group_by(Ledger.product_id)
            .subquery()
        )

        # === Join aggregated ledger to product ===
        product_query = (
            product_query.outerjoin(ledger_subq, ledger_subq.c.product_id == Product.id)
            .add_columns(
                ledger_subq.c.stock_qty.label("stock_qty"),
            )
        )

        # === Paginate using your existing helper ===
        return APIResponse.paginated(
            product_query,
            request,
            lambda row: {
                "id": row.Product.id,
                "code": row.Product.code,
                "name": row.Product.name,
                "unit": row.Product.unit,
                "account_name": row.Product.account.name if row.Product.account else None,
                "quantity": float(row.stock_qty or 0),
            },
        )

        # return APIResponse.paginated(product, request)

    def get_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()

        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")

        response = {
            "id": product.id,
            "code": product.code,
            "name": product.name,
            "unit": product.unit,
            "account_id": product.account_id,
            "account_name": product.account.name if product.account else None,
        }

        return APIResponse.ok(data=response)

    def create_product(self, request: ProductCreate):
        request.name = request.name.upper().strip()
        if request.unit:
            request.unit = request.unit.upper().strip()
        
        # Cek apakah code sudah ada (jika diisi)
        if request.code:
            existing = self.db.query(Product).filter(Product.code == request.code).first()
            if existing:
                return APIResponse.conflict(message=f"Product code '{request.code}' already exists.")

        # Cek apakah name sudah ada
        existing_name = self.db.query(Product).filter(Product.name == request.name).first()
        if existing_name:
            return APIResponse.conflict(message=f"Product name '{request.name}' already exists.")

        product = Product(**request.model_dump())
        self.db.add(product)

        return APIResponse.created()

    def update_product(self, product_id: int, request: ProductUpdate):
        if request.name:
            request.name = request.name.upper().strip()
        if request.unit:
            request.unit = request.unit.upper().strip()
            
        update_data = request.model_dump(exclude_unset=True)

        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")

        # Cek apakah code baru sudah dipakai product lain
        if "code" in update_data and update_data["code"]:
            existing = self.db.query(Product).filter(
                Product.code == update_data["code"],
                Product.id != product_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"Product code '{update_data['code']}' already exists.")

        # Cek apakah name baru sudah dipakai product lain
        if "name" in update_data:
            existing_name = self.db.query(Product).filter(
                Product.name == update_data["name"],
                Product.id != product_id
            ).first()
            if existing_name:
                return APIResponse.conflict(message=f"Product name '{update_data['name']}' already exists.")

        result = (
            self.db.query(Product)
                .filter(Product.id == product_id)
                .update(update_data)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")
        
        return APIResponse.ok(f"Product ID '{product_id}' updated.")

    def delete_product(self, product_id: int):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return APIResponse.not_found(message=f"Product ID '{product_id}' not found.")
        

        # Cek relasi
        purchasing_count = self.db.query(PurchasingDetail).filter(PurchasingDetail.product_id == product_id).count()
        stock_movement_count = self.db.query(StockMovementDetail).filter(StockMovementDetail.product_id == product_id).count()
        color_kitchen_count = self.db.query(ColorKitchenEntryDetail).filter(ColorKitchenEntryDetail.product_id == product_id).count()
        ledger_count = self.db.query(Ledger).filter(Ledger.product_id == product_id).count()
        stock_opname_count = self.db.query(StockOpnameDetail).filter(StockOpnameDetail.product_id == product_id).count()

        total_usage = purchasing_count + stock_movement_count + color_kitchen_count + ledger_count + stock_opname_count

        if total_usage > 0:
            msg = (
                "Product tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{purchasing_count} Purchasing Detail, {stock_movement_count} Stock Movement Detail, "
                f"{color_kitchen_count} Color Kitchen Entry Detail, {ledger_count} Ledger, "
                f"{stock_opname_count} Stock Opname Detail."
            )
            return APIResponse.conflict(message=msg)
        
        self.db.delete(product)

        return APIResponse.ok(f"Product ID '{product_id}' deleted.")
    
    def list_product_ck(self, request: ListRequest):
        # === Subquery 1: products from batch details ===
        q_batch = (
            self.db.query(Product.id.label("product_id"))
            .join(ColorKitchenBatchDetail, Product.id == ColorKitchenBatchDetail.product_id)
        )

        # === Subquery 2: products from entry details ===
        q_entry = (
            self.db.query(Product.id.label("product_id"))
            .join(ColorKitchenEntryDetail, Product.id == ColorKitchenEntryDetail.product_id)
        )

        # === Union: products that appear in either batch or entry ===
        union_subq = q_batch.union(q_entry).subquery()

        # === Base product query (distinct products from CK activity) ===
        product_q = (
            self.db.query(Product)
            .join(union_subq, Product.id == union_subq.c.product_id)
            .outerjoin(Account)
            .options(joinedload(Product.account))
            .distinct()
        )

        # === Filter (search) ===
        if request.q:
            like = f"%{request.q}%"
            product_q = product_q.filter(
                or_(
                    Product.code.ilike(like),
                    Product.name.ilike(like),
                    Product.unit.ilike(like),
                    Account.name.ilike(like),
                )
            )

        # === Sorting ===
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Product, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            product_q = product_q.order_by(sort_col)
        else:
            product_q = product_q.order_by(Product.id)

        # === Paginate ===
        return APIResponse.paginated(
            product_q,
            request,
            lambda row: {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "unit": row.unit,
                "account_name": row.account.name if row.account else None,
            },
        )
