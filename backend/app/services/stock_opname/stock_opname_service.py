from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.stock_opname_input_models import StockOpnameCreate, StockOpnameUpdate, StockOpnameFilter
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import StockOpname, StockOpnameDetail, Account, AccountParent, Product
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class StockOpnameService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_stock_opname(self, request: ListRequest, filters: StockOpnameFilter):
        stock_opname_query = self.db.query(
            StockOpname,
            func.count(StockOpnameDetail.id).label('item_count'),
            func.sum(StockOpnameDetail.system_quantity).label('total_system_qty'),
            func.sum(StockOpnameDetail.physical_quantity).label('total_physical_qty')
        )
        # ).outerjoin(StockOpname.details)\
        # .group_by(StockOpname.id)

        stock_opname_query = stock_opname_query.join(StockOpname.details)\
                                               .join(Product, StockOpnameDetail.product_id == Product.id)\
                                               .join(Account, Product.account_id == Account.id)\
                                               .join(AccountParent, Account.parent_id == AccountParent.id)
        
        stock_opname_query = stock_opname_query.group_by(StockOpname.id)
        stock_opname_query = apply_common_report_filters(stock_opname_query, filters)
        
        if request.q:
            like = f"%{request.q}%"
            stock_opname_query = stock_opname_query.filter(
                or_(
                    StockOpname.code.ilike(like),
                    Product.name.ilike(like)
                )
            )
            
        if request.start_date and request.end_date:
            # try:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            stock_opname_query = stock_opname_query.filter(
                and_(
                    StockOpname.date >= start,
                    StockOpname.date <= end
                )
            )
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(StockOpname, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            stock_opname_query = stock_opname_query.order_by(sort_col)
            
        stock_opname_query = stock_opname_query.order_by(StockOpname.id.desc())

        return APIResponse.paginated(stock_opname_query, request, lambda row: {
            "id": row.StockOpname.id,
            "date": row.StockOpname.date.isoformat() if row.StockOpname.date else None,
            "code": row.StockOpname.code,
            "details": [],
            "item_count": row.item_count or 0,
            "total_system_qty": float(row.total_system_qty) if row.total_system_qty else 0,
            "total_physical_qty": float(row.total_physical_qty) if row.total_physical_qty else 0,
        })

    def get_stock_opname(self, stock_opname_id: int):
        stock_opname = self.db.query(StockOpname).options(
            joinedload(StockOpname.details).joinedload(StockOpnameDetail.product)
        ).filter(StockOpname.id == stock_opname_id).first()

        if not stock_opname:
            return APIResponse.not_found(message=f"Stock Opname ID '{stock_opname_id}' not found.")

        details = []
        for detail in stock_opname.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "system_quantity": float(detail.system_quantity) if detail.system_quantity else 0,
                "physical_quantity": float(detail.physical_quantity) if detail.physical_quantity else 0,
                "difference": float(detail.difference) if detail.difference else 0,
            })

        response = {
            "id": stock_opname.id,
            "date": stock_opname.date.isoformat() if stock_opname.date else None,
            "code": stock_opname.code,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_stock_opname(self, request: StockOpnameCreate):
        stock_opname = StockOpname(
            date=request.date,
            code=request.code
        )
        self.db.add(stock_opname)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = StockOpnameDetail(
                    stock_opname_id=stock_opname.id,
                    product_id=detail_data.product_id,
                    system_quantity=detail_data.system_quantity,
                    physical_quantity=detail_data.physical_quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_stock_opname(self, stock_opname_id: int, request: StockOpnameUpdate):
        stock_opname = self.db.query(StockOpname).filter(StockOpname.id == stock_opname_id).first()
        if not stock_opname:
            return APIResponse.not_found(message=f"Stock Opname ID '{stock_opname_id}' not found.")

        # old_data = {
        #     "date": stock_opname.date.isoformat() if stock_opname.date else None,
        #     "code": stock_opname.code,
        # }

        if request.date is not None:
            stock_opname.date = request.date
        if request.code is not None:
            stock_opname.code = request.code

        if request.details is not None:
            self.db.query(StockOpnameDetail).filter(
                StockOpnameDetail.stock_opname_id == stock_opname_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = StockOpnameDetail(
                    stock_opname_id=stock_opname_id,
                    product_id=detail_data.product_id,
                    system_quantity=detail_data.system_quantity,
                    physical_quantity=detail_data.physical_quantity
                )
                self.db.add(detail)

        # new_data = {
        #     "date": stock_opname.date.isoformat() if stock_opname.date else None,
        #     "code": stock_opname.code,
        # }

        # AuditLoggerService(self.db).log_update(
        #     table_name=StockOpname.__tablename__,
        #     record_id=stock_opname_id,
        #     old_data=old_data,
        #     new_data=new_data,
        #     changed_by="system"
        # )

        return APIResponse.ok(f"Stock Opname ID '{stock_opname_id}' updated.")

    def delete_stock_opname(self, stock_opname_id: int):
        stock_opname = self.db.query(StockOpname).filter(StockOpname.id == stock_opname_id).first()
        if not stock_opname:
            return APIResponse.not_found(message=f"Stock Opname ID '{stock_opname_id}' not found.")
        

        # old_data = {
        #     key: value
        #     for key, value in vars(stock_opname).items()
        #     if not key.startswith("_")
        # }

        # self.db.query(StockOpnameDetail).filter(
        #     StockOpnameDetail.stock_opname_id == stock_opname_id
        # ).delete(synchronize_session=False)

        # AuditLoggerService(self.db).log_delete(
        #     table_name=StockOpname.__tablename__,
        #     record_id=stock_opname_id,
        #     old_data=old_data,
        #     changed_by="system"
        # )

        self.db.delete(stock_opname)

        return APIResponse.ok(f"Stock Opname ID '{stock_opname_id}' deleted.")