from datetime import datetime, date

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_, cast, Numeric
from sqlalchemy.orm import joinedload
from typing import Optional

from app.schemas.input_models.purchasing_input_models import PurchasingCreate, PurchasingUpdate, PurchasingFilter
from app.core.database import Session, get_db
from app.models import Purchasing, PurchasingDetail, Account, Supplier, Product, AccountParent
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters, get_field

class PurchasingService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_purchasing(self, filters: PurchasingFilter):
        purchasing_query = self.db.query(
            Purchasing,
            func.count(PurchasingDetail.id).label('item_count'),
            func.sum(
                cast(
                    (func.coalesce(PurchasingDetail.quantity, 0) * func.coalesce(PurchasingDetail.price, 0))
                    + func.coalesce(PurchasingDetail.ppn * PurchasingDetail.quantity, 0)
                    - func.coalesce(PurchasingDetail.pph, 0),
                    Numeric(18, 2)
                )
            ).label("total_amount")
        )
        
        purchasing_query= purchasing_query.join(Purchasing.details)\
                                          .join(Purchasing.supplier)\
                                          .join(Product, PurchasingDetail.product_id == Product.id)\
                                          .join(Account, Product.account_id == Account.id)\
                                          .join(AccountParent, Account.parent_id == AccountParent.id)
         
        purchasing_query = purchasing_query.group_by(Purchasing.id)
        
        # custom_filters = {
        #     "supplier_ids": [filters.supplier_id] if filters.supplier_id else None,
        #     "product_ids": [filters.product_id] if filters.product_id else None,
        #     "account_ids": [filters.account_id] if filters.account_id else None,
        #     "account_parent_ids": [filters.account_parent_id] if filters.account_parent_id else None,
        # }
        
        # whereu
        # if any(custom_filters.values()):
        print(filters)
        purchasing_query = apply_common_report_filters(purchasing_query, filters)
            
        filter_conditions = []

        if filters.q:
            like = f"%{filters.q}%"
            filter_conditions.append(
                or_(
                    Purchasing.code.ilike(like),
                    Purchasing.purchase_order.ilike(like),
                    Supplier.name.ilike(like),
                )
            )
        
        if filters.start_date:
            filter_conditions.append(Purchasing.date >= filters.start_date)
            
        if filters.end_date:
            filter_conditions.append(Purchasing.date <= filters.end_date)
                # purchasing = purchasing.filter(
                #     and_(
                #         Purchasing.date >= start,
                #         Purchasing.date <= end
                #     )
                # )
            
            
        if filter_conditions:
            purchasing_query = purchasing_query.filter(and_(*filter_conditions))
            
        if filters.sort_by and filters.sort_dir:
            sort_col = getattr(Purchasing, filters.sort_by)
            if filters.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            purchasing_query = purchasing_query.order_by(sort_col)
                                
        purchasing_query = purchasing_query.order_by(Purchasing.id.desc())
            # except ValueError as e:
            #     print(f"⚠️ Invalid date format: {e}")  # Ignore jika format salah
        

        return APIResponse.paginated(purchasing_query, filters, lambda row: {
            "id": row.Purchasing.id,
            "date": row.Purchasing.date.isoformat() if row.Purchasing.date else None,
            "code": row.Purchasing.code,
            "purchase_order": row.Purchasing.purchase_order,
            "supplier_id": row.Purchasing.supplier_id,
            "supplier_name": row.Purchasing.supplier.name if row.Purchasing.supplier else None,
            "details": [],
            "item_count": row.item_count or 0,
            "total_amount": float(row.total_amount) if row.total_amount else 0,
        })


    def get_purchasing(self, purchasing_id: int):
        purchasing = self.db.query(Purchasing).options(
            joinedload(Purchasing.supplier),
            joinedload(Purchasing.details).joinedload(PurchasingDetail.product)
        ).filter(Purchasing.id == purchasing_id).first()

        if not purchasing:
            return APIResponse.not_found(message=f"Purchasing ID '{purchasing_id}' not found.")

        details = []
        for detail in purchasing.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity) if detail.quantity else 0,
                "price": float(detail.price) if detail.price else 0,
                "discount": float(detail.discount) if detail.discount else 0,
                "ppn": float(detail.ppn) if detail.ppn else 0,
                "pph": float(detail.pph) if detail.pph else 0,
                "dpp": float(detail.dpp) if detail.dpp else 0,
                "tax_no": detail.tax_no,
                "exchange_rate": float(detail.exchange_rate) if detail.exchange_rate else 0,
            })

        response = {
            "id": purchasing.id,
            "date": purchasing.date.isoformat() if purchasing.date else None,
            "code": purchasing.code,
            "purchase_order": purchasing.purchase_order,
            "supplier_id": purchasing.supplier_id,
            "supplier_name": purchasing.supplier.name if purchasing.supplier else None,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_purchasing(self, request: PurchasingCreate):
        try:
            # Create purchasing header
            purchasing = Purchasing(
                date=request.date,
                code=request.code,
                purchase_order=request.purchase_order,
                supplier_id=request.supplier_id
            )
            self.db.add(purchasing)
            self.db.flush()  # Get purchasing.id

            # Create purchasing details
            if request.details:
                for detail_data in request.details:
                    detail = PurchasingDetail(
                        purchasing_id=purchasing.id,
                        product_id=detail_data.product_id,
                        quantity=detail_data.quantity,
                        price=detail_data.price,
                        discount=detail_data.discount,
                        ppn=detail_data.ppn,
                        pph=detail_data.pph,
                        dpp=detail_data.dpp,
                        tax_no=detail_data.tax_no,
                        exchange_rate=detail_data.exchange_rate
                    )
                    self.db.add(detail)

            # ✅ COMMIT - CRITICAL!
            self.db.commit()
            self.db.refresh(purchasing)

            return APIResponse.created(message=f"Purchasing '{purchasing.code}' created successfully.")
        
        except Exception as e:
            self.db.rollback()  # ✅ Rollback jika error
            raise HTTPException(status_code=500, detail=f"Failed to create purchasing: {str(e)}")

    def update_purchasing(self, purchasing_id: int, request: PurchasingUpdate):
        try:
            purchasing = self.db.query(Purchasing).filter(Purchasing.id == purchasing_id).first()
            if not purchasing:
                return APIResponse.not_found(message=f"Purchasing ID '{purchasing_id}' not found.")

            # Update header
            if request.date is not None:
                purchasing.date = request.date
            if request.code is not None:
                purchasing.code = request.code
            if request.purchase_order is not None:
                purchasing.purchase_order = request.purchase_order
            if request.supplier_id is not None:
                purchasing.supplier_id = request.supplier_id

            # Update details
            if request.details is not None:
                # Delete old details
                self.db.query(PurchasingDetail).filter(
                    PurchasingDetail.purchasing_id == purchasing_id
                ).delete(synchronize_session=False)

                # Insert new details
                for detail_data in request.details:
                    detail = PurchasingDetail(
                        purchasing_id=purchasing_id,
                        product_id=detail_data.product_id,
                        quantity=detail_data.quantity,
                        price=detail_data.price,
                        discount=detail_data.discount,
                        ppn=detail_data.ppn,
                        pph=detail_data.pph,
                        dpp=detail_data.dpp,
                        tax_no=detail_data.tax_no,
                        exchange_rate=detail_data.exchange_rate
                    )
                    self.db.add(detail)

            # ✅ COMMIT - CRITICAL!
            self.db.commit()
            
            return APIResponse.ok(message=f"Purchasing ID '{purchasing_id}' updated successfully.")
        
        except Exception as e:
            self.db.rollback()  # ✅ Rollback jika error
            raise HTTPException(status_code=500, detail=f"Failed to update purchasing: {str(e)}")

    def delete_purchasing(self, purchasing_id: int):
        try:
            purchasing = self.db.query(Purchasing).filter(Purchasing.id == purchasing_id).first()
            if not purchasing:
                return APIResponse.not_found(message=f"Purchasing ID '{purchasing_id}' not found.")

            # Delete details first (foreign key)
            # self.db.query(PurchasingDetail).filter(
            #     PurchasingDetail.purchasing_id == purchasing_id
            # ).delete(synchronize_session=False)

            # Delete purchasing
            self.db.delete(purchasing)

            # ✅ COMMIT - CRITICAL!
            self.db.commit()

            return APIResponse.ok(message=f"Purchasing ID '{purchasing_id}' deleted successfully.")
        
        except Exception as e:
            self.db.rollback()  # ✅ Rollback jika error
            raise HTTPException(status_code=500, detail=f"Failed to delete purchasing: {str(e)}")