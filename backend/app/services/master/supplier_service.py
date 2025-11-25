from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.master_input_models import SupplierCreate, SupplierUpdate
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import (Supplier, Purchasing, PurchasingDetail,
                        ColorKitchenBatchDetail, ColorKitchenEntryDetail, Product)
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse


class SupplierService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_supplier(self, request: ListRequest):
        supplier = self.db.query(Supplier)

        if request.q:
            like = f"%{request.q}%"
            supplier = supplier.filter(
                or_(
                    Supplier.code.ilike(like),
                    Supplier.name.ilike(like),
                    Supplier.contact_info.ilike(like),
                )
            ).order_by(Supplier.id)
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Supplier, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            supplier = supplier.order_by(sort_col)

        return APIResponse.paginated(
            supplier, 
            request,
            lambda row: {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "contact_info": row.contact_info,
            },
        )

    def get_supplier(self, supplier_id: int):
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()

        if not supplier:
            return APIResponse.not_found(message=f"Supplier ID '{supplier_id}' not found.")

        purchasings = []
        for purchasing in sorted(supplier.purchasings, key=lambda x: x.date or datetime.max):
            purchasings.append({
                "id": purchasing.id,
                "date": purchasing.date.isoformat() if purchasing.date else None,
                "total_amount": purchasing.total_amount,
                "status": purchasing.status,
            })

        response = {
            "id": supplier.id,
            "code": supplier.code,
            "name": supplier.name,
            "contact_info": supplier.contact_info,
            "purchasings": purchasings,
        }

        return APIResponse.ok(data=response)

    def create_supplier(self, request: SupplierCreate):
        # Cek apakah code sudah ada
        existing = self.db.query(Supplier).filter(Supplier.code == request.code).first()
        if existing:
            return APIResponse.conflict(message=f"Supplier code '{request.code}' already exists.")

        supplier = Supplier(**request.model_dump())
        self.db.add(supplier)

        # Populate supplier.id without committing the whole transaction
        # self.db.flush()

        return APIResponse.created()

    def update_supplier(self, supplier_id: int, request: SupplierUpdate):
        update_data = request.model_dump(exclude_unset=True)

        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return APIResponse.not_found(message=f"Supplier ID '{supplier_id}' not found.")

        # Cek apakah code baru sudah dipakai supplier lain
        if "code" in update_data:
            existing = self.db.query(Supplier).filter(
                Supplier.code == update_data["code"],
                Supplier.id != supplier_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"Supplier code '{update_data['code']}' already exists.")

        result = (
            self.db.query(Supplier)
                .filter(Supplier.id == supplier_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Supplier ID '{supplier_id}' not found.")

        return APIResponse.ok(f"Supplier ID '{supplier_id}' updated.")

    def delete_supplier(self, supplier_id: int):
        supplier = self.db.query(Supplier).filter(Supplier.id == supplier_id).first()
        if not supplier:
            return APIResponse.not_found(message=f"Supplier ID '{supplier_id}' not found.")

        # Cek relasi: jika sudah dipakai di purchasing, tolak hapus
        purchasing_count = self.db.query(Purchasing).filter(Purchasing.supplier_id == supplier_id).count()

        if purchasing_count > 0:
            # kembalikan info detail agar frontend bisa tampilkan popup
            msg = (
                "Supplier tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{purchasing_count} Purchasing."
            )
            # pakai ValueError agar ditangkap router dan diubah ke HTTP 409
            return APIResponse.conflict(message=msg)
        
        self.db.delete(supplier)

        return APIResponse.ok(f"Supplier ID '{supplier_id}' deleted.")
    
    def list_supplier_ck(self, request: ListRequest):
        # === Subquery: suppliers linked to CK-related products (batch or entry) ===
        q_batch = (
            self.db.query(Supplier.id.label("supplier_id"))
            .join(Purchasing, Purchasing.supplier_id == Supplier.id)
            .join(PurchasingDetail, PurchasingDetail.purchasing_id == Purchasing.id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(ColorKitchenBatchDetail, ColorKitchenBatchDetail.product_id == Product.id)
        )

        q_entry = (
            self.db.query(Supplier.id.label("supplier_id"))
            .join(Purchasing, Purchasing.supplier_id == Supplier.id)
            .join(PurchasingDetail, PurchasingDetail.purchasing_id == Purchasing.id)
            .join(Product, Product.id == PurchasingDetail.product_id)
            .join(ColorKitchenEntryDetail, ColorKitchenEntryDetail.product_id == Product.id)
        )

        # Union both → suppliers that appear in either batch or entry
        supplier_subq = q_batch.union(q_entry).subquery()

        # === Main query: distinct suppliers appearing in CK activity ===
        supplier_q = (
            self.db.query(Supplier)
            .join(supplier_subq, supplier_subq.c.supplier_id == Supplier.id)
            .distinct()
        )

        # === Search ===
        if request.q:
            like = f"%{request.q}%"
            supplier_q = supplier_q.filter(
                or_(
                    Supplier.code.ilike(like),
                    Supplier.name.ilike(like),
                    Supplier.contact_info.ilike(like),
                )
            )

        # === Sorting ===
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Supplier, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            supplier_q = supplier_q.order_by(sort_col)
        else:
            supplier_q = supplier_q.order_by(Supplier.id)

        # === Paginate ===
        return APIResponse.paginated(
            supplier_q,
            request,
            lambda row: {
                "id": row.id,
                "code": row.code,
                "name": row.name,
                "contact_info": row.contact_info,
            },
        )
