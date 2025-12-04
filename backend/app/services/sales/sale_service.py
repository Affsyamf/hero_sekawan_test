from fastapi import Depends, HTTPException, status
from sqlalchemy import or_, and_
from datetime import datetime

from app.core.database import get_db
from app.models import Sale, Client, ColorKitchenEntry, Design
from app.schemas.input_models.sales_input_models import SalesCreate, SalesUpdate, SalesFilter
from app.utils.response import APIResponse
from app.utils.datatable.request import ListRequest



class SalesService:
    def __init__(self, db = Depends(get_db)):
        self.db = db
        
    def create_sale(self, request: SalesCreate):
        try:
            active_client = self.db.query(Client).filter(
                Client.id == request.client_id,
                Client.deleted_at.is_(None)
            ).first()
            
            if not active_client:
                deleted_client = self.db.query(Client).filter(Client.id == request.client_id).first()
                
                if deleted_client and deleted_client.deleted_at is not None:
                    return APIResponse.error(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        message=f"Client ID '{request.client_id}' has been soft-deleted and cannot be used."
                    )
                else:
                    return APIResponse.not_found(message=f"Client ID '{request.client_id}' not found.")
            
            active_ck_entry = self.db.query(ColorKitchenEntry).filter(
                ColorKitchenEntry.id == request.color_kitchen_id,
                ColorKitchenEntry.deleted_at.is_(None)
            ).first()
            
            if not active_ck_entry:
                deleted_ck_entry = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.id == request.color_kitchen_id).first()
                
                if deleted_ck_entry and deleted_ck_entry.deleted_at is not None:
                    return APIResponse.error(
                        status_code = status.HTTP_400_BAD_REQUEST,
                        message=f"Color Kitchen ID '{request.color_kitchen_id}' has been deleted."
                    )
                    
                else:
                    return APIResponse.not_found(message=f"Color Kitchen '{request.color_kitchen_id}' not found.")
            
            
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
        
        except HTTPException as e:
            return APIResponse.error(status_code=e.status_code, message=e.detail)
        except Exception as e:
            self.db.rollback()
            return APIResponse.internal_error(message=str(e))
        
        
    def list_sale(self, request: ListRequest, filters: SalesFilter):
        sale_query = self.db.query(Sale)
        filter_conditions = []
        
        # join ke client atu ck enty
        design_ck_join = filters.design_id or filters.color_kitchen_id
        
        if request.q:
            sale_query = sale_query.outerjoin(Client, Sale.client_id == Client.id)
        
        # join ke ck untuk filter ck atau design_id
        if design_ck_join:
            sale_query = sale_query.outerjoin(
                ColorKitchenEntry,
                Sale.color_kitchen_id == ColorKitchenEntry.id
            )
        
        # join ke design jika filter design_id ada
        if filters.design_id:
            sale_query = sale_query.outerjoin(
                Design,
                ColorKitchenEntry.design_id == Design.id
            )
        
        if request.q:
            like = f"%{request.q}%"
            filter_conditions.append(
                or_(
                    Sale.code.ilike(like),
                    Client.name.ilike(like),
                )
            )
            
        if filters.start_date:
            filter_conditions.append(Sale.date >= filters.start_date)
            
        if filters.end_date:
            filter_conditions.append(Sale.date <= filters.end_date)
        
        if filters.client_id:
            filter_conditions.append(Sale.client_id == filters.client_id)
            
        if filters.color_kitchen_id:
            filter_conditions.append(Sale.color_kitchen_id == filters.color_kitchen_id)
            
        if filters.design_id:
            filter_conditions.append(Design.id == filters.design_id)
            
        if filter_conditions:
            sale_query = sale_query.filter(and_(*filter_conditions))
            
            
        return APIResponse.paginated(
            sale_query, request, lambda sale: {
                "id": sale.id,
                "code": sale.code,
                "date": sale.date.isoformat() if sale.date else None,
                "quantity_start": float(sale.quantity_start),
                "quantity_end": float(sale.quantity_end),
                "client_id": sale.client_id,
                "color_kitchen_id": sale.color_kitchen_id,
                "client_name": sale.client.name if sale.client else None
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
            "date": sale.date.isoformat() if sale.date else None,
            "quantity_start": float(sale.quantity_start),
            "quantity_end": float(sale.quantity_end),
            "client_id": sale.client_id,
            "color_kitchen_id": sale.color_kitchen_id,
        })
        
        
        
    def update_sale(self, sale_id: int, request: SalesUpdate):
        
        sale = self.db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            return APIResponse.not_found(message=f"Sale ID '{sale_id}' not found")
        
        update_data = request.model_dump(exclude_unset = True)
        
        if "client_id" in update_data:
            client_id_to_check = update_data["client_id"]
            active_client = self.db.query(Client).filter(
                Client.id == client_id_to_check,
                Client.deleted_at.is_(None)
            ).first()
            
            if not active_client:
                deleted_client = self.db.query(Client).filter(Client.id == client_id_to_check).first()
                
                if deleted_client and deleted_client.deleted_at is not None:
                    return APIResponse.error(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        message=f"Client ID '{client_id_to_check}' has been deleted"
                    )
                else:
                    return APIResponse.not_found(message=f"Client ID '{client_id_to_check}' not found.")
        
        if "color_kitchen_id" in update_data:
            ck_id_to_check = update_data["color_kitchen_id"]
            active_ck_entry = self.db.query(ColorKitchenEntry).filter(
                ColorKitchenEntry.id == ck_id_to_check,
                ColorKitchenEntry.deleted_at.is_(None)
            ).first()
            
            if not active_ck_entry:
                deleted_ck_entry = self.db.query(ColorKitchenEntry).filter(ColorKitchenEntry.id == ck_id_to_check).first()
                
                if deleted_ck_entry and deleted_ck_entry.deleted_at is not None:
                    return APIResponse.error(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        message=f"Color Kitchen '{ck_id_to_check} has been deleted'"
                    )
                    
                else:
                    return APIResponse.not_found(message=f"Color Kitchen ID '{ck_id_to_check}' not found.")
        
        
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
        
    
