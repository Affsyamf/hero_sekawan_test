from fastapi import Depends
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models import Delivery, Product, Client, ColorKitchenEntry, ColorKitchenEntryDetail
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
        })


    def list_delivery(self, request: ListRequest):
        # filters alias
        f = request.filters

        # Base query
        delivery_query = (
            self.db.query(Delivery)
            .join(Sale, Delivery.sale_id == Sale.id)
            .join(Client, Sale.client_id == Client.id)
            .join(ColorKitchenEntry, Sale.color_kitchen_id == ColorKitchenEntry.id)
            .join(ColorKitchenEntryDetail, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)
            .join(Product, ColorKitchenEntryDetail.product_id == Product.id)
        )

        # Filter client (universal)
        if f.client_ids:
            delivery_query = delivery_query.filter(Client.id.in_(f.client_ids))

        # Filter CK
        if f.ck_ids:
            delivery_query = delivery_query.filter(ColorKitchenEntry.id.in_(f.ck_ids))

        # Filter product
        if f.product_ids:
            delivery_query = delivery_query.filter(Product.id.in_(f.product_ids))

        # Date range
        if f.start_date:
            delivery_query = delivery_query.filter(Delivery.date >= f.start_date[0])

        if f.end_date:
            delivery_query = delivery_query.filter(Delivery.date <= f.end_date[0])

        # SEARCH (q)
        if request.q:
            like = f"%{request.search_str}%"
            delivery_query = delivery_query.filter(
                or_(
                    Delivery.code.ilike(like),
                    Client.name.ilike(like),
                    Product.name.ilike(like),
                )
            )

        # Sorting default
        delivery_query = delivery_query.order_by(Delivery.id.desc())

        return APIResponse.paginated(
            delivery_query,
            request,
            lambda d: {
                "id": d.id,
                "code": d.code,
                "date": d.date.isoformat() if d.date else None,
                "quantity": float(d.quantity) if d.quantity is not None else None,

                "sale_id": d.sale_id,
                "return_id": d.return_id,

                "sale_client_id": d.sale.client_id if d.sale else None,
                "sale_color_kitchen_id": d.sale.color_kitchen_id if d.sale else None,
            },
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
