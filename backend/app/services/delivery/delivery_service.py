from fastapi import Depends
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models import Delivery, Product, Client, ColorKitchenEntry, ColorKitchenEntryDetail, Opj
from app.schemas.input_models.deliveries_input_models import DeliveryCreate, DeliveryUpdate, DeliveryFilter
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse
from app.models.sales import Sale
from app.utils.filters import apply_common_report_filters



class DeliveryService:
    def __init__(self, db=Depends(get_db)):
        self.db = db


    def create_delivery(self, request: DeliveryCreate):
        sale = self.db.query(Sale).filter(Sale.id == request.sale_id).first()
        if not sale:
            return APIResponse.bad_request(message=f"Sale ID '{request.sale_id}' not found. ")
        # check duplicate code
        existing = self.db.query(Delivery).filter(
            Delivery.code == request.code
        ).first()

        if existing:
            return APIResponse.bad_request(
                message=f"Delivery code '{request.code}' already exists."
            )

        delivery = Delivery(**request.model_dump())
        self.db.add(delivery)
        self.db.commit()
        self.db.refresh(delivery)

        return APIResponse.created(data={
            "id": delivery.id,
            "code": delivery.code,
            "date": delivery.date.isoformat() if delivery.date else None,
            "quantity": float(delivery.quantity) if delivery.quantity is not None else None,
            "sale_id": delivery.sale_id,
            "return_id": delivery.return_id,
            "roll": float(delivery.roll)
        })


    def list_delivery(self, filters: DeliveryFilter):
        delivery_query = self.db.query(Delivery)
        
        delivery_query = delivery_query.join(Sale, Delivery.sale_id == Sale.id)\
                                       .join(Client, Sale.client_id == Client.id)\
                                       .join(Opj, Sale.opj_id == Opj.id)\
                                       .join(ColorKitchenEntry, ColorKitchenEntry.opj_id == Opj.id)\
                                       .join(ColorKitchenEntryDetail, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)\
                                       .join(Product, ColorKitchenEntryDetail.product_id == Product.id)
                                       
        delivery_query = apply_common_report_filters(delivery_query, filters)
        
        filter_conditions = []
        
        if filters.q:
            like = f"%{filters.q}%"
            filter_conditions.append(
                or_(
                    Delivery.code.ilike(like),
                    Client.name.ilike(like),
                    Product.name.ilike(like)
                )
            )
            
        
        if filters.start_date:
            filter_conditions.append(Delivery.date >= filters.start_date)
            
        if filters.end_date:
            filter_conditions.append(Delivery.date <= filters.end_date)
        
        if filter_conditions:
            delivery_query = delivery_query.filter(and_(*filter_conditions))
            

        return APIResponse.paginated(
            delivery_query, filters,
            lambda d: {
                "id": d.id,
                "code": d.code,
                "date": d.date.isoformat() if d.date else None,
                "quantity": float(d.quantity) if d.quantity is not None else None,
                "sale_id": d.sale_id,
                "return_id": d.return_id,
                "sale_client_id": d.sale.client_id if d.sale else None,
                "roll": float(d.roll)
                # "sale_color_kitchen_id": d.sale.color_kitchen_id if d.sale else None
            }
        )


    def get_delivery(self, delivery_id: int):
        delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()

        if not delivery:
            return APIResponse.not_found(message=f"Delivery ID '{delivery_id}' not found.")

        return APIResponse.ok(data={
            "id": delivery.id,
            "code": delivery.code,
            "date": delivery.date.isoformat() if delivery.date else None,
            "quantity": float(delivery.quantity) if delivery.quantity is not None else None,
            "sale_id": delivery.sale_id,
            "return_id": delivery.return_id,
            "roll": delivery.roll
        })


    def update_delivery(self, delivery_id: int, request: DeliveryUpdate):
        delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()

        if not delivery:
            return APIResponse.not_found(message=f"Delivery ID '{delivery_id}' not found.")

        update_data = request.model_dump(exclude_unset=True)
        
        if "sale_id" in update_data and update_data["sale_id"] is not None:
            sale = self.db.query(Sale).filter(Sale.id == update_data["sale_id"]).first()
            if not sale:
                return APIResponse.bad_request(message=f"Sale ID '{update_data['sale_id']}' not found.")
            
        if "code" in update_data and update_data["code"] != delivery.code:
            existing = self.db.query(Delivery).filter(
                Delivery.code == update_data["code"],
                Delivery.id != delivery_id
            ).first()
            if existing:
                return APIResponse.bad_request(
                    message=f"Delivery Code '{update_data['code']}' alredy exist."
                )
                
        for key, value in update_data.items():
            setattr(delivery, key, value)

        self.db.add(delivery)
        self.db.commit()
        self.db.refresh(delivery)

        return APIResponse.ok(f"Delivery ID '{delivery_id}' updated.")


    def delete_delivery(self, delivery_id: int):
        delivery = self.db.query(Delivery).filter(Delivery.id == delivery_id).first()

        if not delivery:
            return APIResponse.not_found(message=f"Delivery ID '{delivery_id}' not found.")

        self.db.delete(delivery)
        self.db.commit()

        return APIResponse.ok(f"Delivery ID '{delivery_id}' deleted.")