from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from fastapi import Depends
from app.core.database import get_db
import logging
from typing import Any

from app.models.delivery import Delivery
from app.schemas.input_models.deliveries_input_models import DeliveryCreate, DeliveryUpdate

logger = logging.getLogger(__name__)
# USER_ID_CONTEXT_KEY = 'user_id'
CONTEXT_KEYS = ['user_id', 'uid', 'id', 'user_id_context', 'current_user_id'] 


class DeliveryService:
    def __init__(self, db=Depends(get_db)):
        self.db = db
        
    def create_delivery(self, payload: DeliveryCreate):
        existing = self.db.query(Delivery).filter(
            Delivery.code == payload.code,
            Delivery.deleted_at.is_(None)
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Delivery code '{payload.code}' alredy exist."
            )
            
        new_delivery = Delivery(
            code = payload.code,
            date = payload.date,
            quantity = payload.quantity,
            sale_id = payload.sale_id,
            return_id = payload.return_id,
        )
        
        
        self.db.add(new_delivery)
        self.db.commit()
        self.db.refresh(new_delivery)
        
        return new_delivery


    def get_all_deliveries(self):
        return self.db.query(Delivery).filter(
            Delivery.deleted_at.is_(None)
        ).all()
        
        
        
    def get_delivery_by_id(self, delivery_id: int):
        delivery = self.db.query(Delivery).filter(
            Delivery.id == delivery_id,
            Delivery.deleted_at.is_(None)
        ).first()
        
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery Not Found"
            )
            
        return delivery


    def update_delivery(self, delivery_id: int, payload: DeliveryUpdate):
        delivery = self.get_delivery_by_id(delivery_id)
        
        update_data = payload.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(delivery, key, value)
        
        self.db.commit()
        self.db.refresh(delivery)
        
        return delivery

    def soft_delete_delivery(self, delivery_id: int, user_id: int):

        delivery = self.get_delivery_by_id(delivery_id)
        if not delivery:
            raise HTTPException(
                status_code=404,
                detail=f"Delivery ID '{delivery_id}' not found"
            )

        delivery.deleted_at = datetime.now()
        delivery.deleted_by = user_id

        self.db.commit()

        return {"message": "Delivery deleted successfully"}