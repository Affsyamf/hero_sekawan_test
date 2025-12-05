from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.stock_movement_input_models import StockMovementCreate, StockMovementUpdate, StockMovementFilter
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import StockMovement, StockMovementDetail, Product
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class StockMovementService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_stock_movement(self, request: ListRequest, filters: StockMovementFilter):
        stock_movement_query = self.db.query(
            StockMovement,
            func.count(StockMovementDetail.id).label('item_count'),
            func.sum(StockMovementDetail.quantity).label('total_quantity')
        ).outerjoin(StockMovement.details)\
        .group_by(StockMovement.id)
            
        stock_movement_query = stock_movement_query.join(StockMovement.details)
        
        if filters.product_ids:
            stock_movement_query = stock_movement_query.join(Product, StockMovementDetail.product_id == Product.id)
            
        stock_movement_query = stock_movement_query.group_by(StockMovement.id)
        
        if filters.product_ids:
            stock_movement_query = apply_common_report_filters(stock_movement_query, filters)
            
        filter_conditions = []
        
        if request.q:
            like = f"%{request.q}%"
            filter_conditions.append(
                or_(
                    StockMovement.code.ilike(like),
                )
            )
            
        if request.start_date and request.end_date:
            # try:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            
            stock_movement = stock_movement.filter(
                and_(
                    StockMovement.date >= start,
                    StockMovement.date <= end
                )
            )
        
        if filter_conditions:
            stock_movement_query = stock_movement_query.filter(and_(*filter_conditions))
        
        if request.sort_by and request.sort_dir:
            sort_col = getattr(StockMovement, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            stock_movement_query = stock_movement_query.order_by(sort_col)

        stock_movement_query = stock_movement_query.order_by(StockMovement.id.desc())
        
        return APIResponse.paginated(stock_movement_query, request, lambda row: {
            "id": row.StockMovement.id,
            "date": row.StockMovement.date.isoformat() if row.StockMovement.date else None,
            "code": row.StockMovement.code,
            "details": [],
            "item_count": row.item_count or 0,
            "total_quantity": float(row.total_quantity) if row.total_quantity else 0,
        })
        # return APIResponse.paginated(stock_movement, request)

    def get_stock_movement(self, stock_movement_id: int):
        stock_movement = self.db.query(StockMovement).options(
            joinedload(StockMovement.details).joinedload(StockMovementDetail.product)
        ).filter(StockMovement.id == stock_movement_id).first()

        if not stock_movement:
            return APIResponse.not_found(message=f"Stock Movement ID '{stock_movement_id}' not found.")

        details = []
        for detail in stock_movement.details:
            details.append({
                "id": detail.id,
                "product_id": detail.product_id,
                "product_name": detail.product.name if detail.product else None,
                "quantity": float(detail.quantity) if detail.quantity else 0,
            })

        response = {
            "id": stock_movement.id,
            "date": stock_movement.date.isoformat() if stock_movement.date else None,
            "code": stock_movement.code,
            "details": details,
        }

        return APIResponse.ok(data=response)

    def create_stock_movement(self, request: StockMovementCreate):
        stock_movement = StockMovement(
            date=request.date,
            code=request.code
        )
        self.db.add(stock_movement)
        self.db.flush()

        if request.details:
            for detail_data in request.details:
                detail = StockMovementDetail(
                    stock_movement_id=stock_movement.id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        return APIResponse.created()

    def update_stock_movement(self, stock_movement_id: int, request: StockMovementUpdate):
        stock_movement = self.db.query(StockMovement).filter(StockMovement.id == stock_movement_id).first()
        if not stock_movement:
            return APIResponse.not_found(message=f"Stock Movement ID '{stock_movement_id}' not found.")

        if request.date is not None:
            stock_movement.date = request.date
        if request.code is not None:
            stock_movement.code = request.code

        if request.details is not None:
            self.db.query(StockMovementDetail).filter(
                StockMovementDetail.stock_movement_id == stock_movement_id
            ).delete(synchronize_session=False)

            for detail_data in request.details:
                detail = StockMovementDetail(
                    stock_movement_id=stock_movement_id,
                    product_id=detail_data.product_id,
                    quantity=detail_data.quantity
                )
                self.db.add(detail)

        return APIResponse.ok(f"Stock Movement ID '{stock_movement_id}' updated.")

    def delete_stock_movement(self, stock_movement_id: int):
        stock_movement = self.db.query(StockMovement).filter(StockMovement.id == stock_movement_id).first()
        if not stock_movement:
            return APIResponse.not_found(message=f"Stock Movement ID '{stock_movement_id}' not found.")

        # self.db.query(StockMovementDetail).filter(
        #     StockMovementDetail.stock_movement_id == stock_movement_id
        # ).delete(synchronize_session=False)

        self.db.delete(stock_movement)

        return APIResponse.ok(f"Stock Movement ID '{stock_movement_id}' deleted.")