from fastapi import Depends
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Payment, Sale
from app.schemas.input_models.sales_input_models import PaymentCreate, PaymentUpdate
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse


class PaymentService:
    def __init__(self, db= Depends(get_db)):
        self.db = db
        
    def create_payment(self, request: PaymentCreate):
        sale = self.db.query(Sale).filter(Sale.id == request.sale_id).first()
        if not sale:
            return APIResponse.not_found(message=f"Sale ID '{request.sale_id}' not found.")
        
        payment = Payment(**request.model_dump())
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return APIResponse.created(data={
            "id": payment.id,
            "date": payment.date,
            "amount": payment.amount,
            "sale_id": payment.sale_id,
        })
        
    def list_payment(self, request: ListRequest):
        payment_query = self.db.query(Payment)
        
        if request.q:
            like = f"%{request.q}%"
            payment_query = payment_query.filter(
                or_(
                    Payment.amount.ilike(like), 
                )
            )
            
        return APIResponse.paginated(
            payment_query, request,
            lambda p: {
                "id": p.id,
                "date": p.date,
                "amount": p.amount,
                "sale_id": p.sale_id
            }
        )
        
    
    def get_payment(self, payment_id: int):
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return APIResponse.not_found(message=f"Payment ID '{payment_id}' not found ")
        
        return APIResponse.ok(data={
            "id": payment.id,
            "date": payment.date,
            "amount": payment.amount,
            "sale_id": payment.sale_id,
        })
        
        
    def update_payment(self, payment_id: int, request: PaymentUpdate):
        update_data = request.model_dump(exclude_unset = True)
        
        payment = self.db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return APIResponse.not_found(message=f"Payment ID '{payment_id}' not found.")
        
        if "sale_id" in update_data:
            new_sale = self.db.query(Sale).filter(Sale.id == update_data["sale_id"]).first()
            if not new_sale:
                return APIResponse.not_found(message=f"Sale ID '{update_data['sale_id']}' not found.")

        for key, value in update_data.items():
            setattr(payment, key, value)
            
        
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        
        return APIResponse.ok(f"Payment ID '{payment_id}' updated.")
    
    
    def delete_payment(self, payment_id: int):
        payment = self.db.query(Payment).filter(Paymet.id == payment_id).first()
        if not payment:
            return APIResponse.not_found(message=f"Payment ID '{payment_id}' not found.")

        self.db.delete(payment)
        self.db.commit()

        return APIResponse.ok(f"Payment ID '{payment_id}' deleted.")