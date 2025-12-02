from fastapi import Depends
from sqlalchemy import or_
from datetime import datetime

from app.core.database import get_db
from app.models import Sale
from app.schemas.input_models.sales_input_models import SalesCreate, SalesUpdate
from app.utils.response import APIResponse
from app.utils.datatable.request import ListRequest



class SalesService:
    def __init__(self, db = Depends(get_db)):
        self.db = db
        
    def create_sale(self, request: SalesCreate):
        try:
            existing = self.db.query(Sale).filter(Sale.code == request.code).first()
            if existing:
                return APIResponse.conflict(message=f"Sale with code '{request.code}' alredy exist.")
            
            sale = Sale(**request.model_dump())
            
            self.db.add(sale)
            self.db.commit()
            self.db.refresh(sale)
            
            return APIResponse.created(data={
                "id": sale.id,
                "code": sale.code,
                "quantity_start": float(sale.quantity_start),
                "quantity_end": float(sale.quantity_end),
                "client_id": sale.client_id,
                "color_kitchen_id": sale.color_kitchen_id,
            })
        
        except Exception as e:
            self.db.rollback()
            return APIResponse.error(message=str(e))
        
        
    def list_sale(self, request: ListRequest):
        sale_query = self.db.query(Sale)
        
        if request.q:
            like = f"%{request.q}%"
            sale_query = sale_query.filter(
                or_(
                    Sale.code.ilike(like),
                )
            )
            
        return APIResponse.paginated(
            sale_query, request, lambda sale: {
                "id": sale.id,
                "code": sale.code,
                "date": sale.date,
                "quantity_start": sale.quantity_start,
                "quantity_end": sale.quantity_end,
                "client_id": sale.client_id,
                "color_kitchen_id": sale.color_kitchen_id,
            }
        )
        
    
    def get_sale(self, sale_id: int):
        sale = self.db.query(Sale). filter(
            Sale.id == sale_id
        ).first()
        if not sale:
            return APIResponse.not_found(message=f"Sale ID '{sale_id}' not found")
        
        return APIResponse.ok(data={
            "id": sale.id,
            "code": sale.code,
            "date": sale.date,
            "quantity_start": sale.quantity_start,
            "quantity_end": sale.quantity_end,
            "client_id": sale.client_id,
            "color_kitchen_id": sale.color_kitchen_id,
        })
        
    def update_sale(self, sale_id: int, request: SalesUpdate):
        
        sale = self.db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            return APIResponse.not_found(message=f"Sale ID '{sale_id}' not found")
        
        update_data = request.model_dump(exclude_unset = True)
        
        if "code" in update_data:
            existing_code = self.db.query(Sale).filter(
                Sale.code == update_data["code"],
                Sale.id != sale_id
            ).first()
            if existing_code:
                return APIResponse.conflict(message=f"Sale code '{update_data['code']}' alredy exist.")
            
        for key, value in update_data.items():
            setattr(sale, key, value)
            
        self.db.add(sale)
        self.db.commit()
        self.db.refresh(sale)
        
        return APIResponse.ok(message=f"Sale ID '{sale_id}' updated.")
    
    
    def delete_sale(self, sale_id: int):
        sale = self.db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            return APIResponse.not_found(message=f"Sale ID '{sale_id}' Not found.")
        
        self.db.delete(sale)
        self.db.commit()
        
        return APIResponse.ok(message=f"Sale ID '{sale_id}' deleted.")
        
    
