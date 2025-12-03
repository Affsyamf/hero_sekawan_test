from fastapi import Depends
from sqlalchemy import or_

from app.core.database import get_db
from app.models import Return, Sale
from app.schemas.input_models.sales_input_models import ReturnCreate, ReturnUpdate
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse


class ReturnService:
    def __init__(self, db=Depends(get_db)):
        self.db = db
        
    
    def create_return(self, request: ReturnCreate):
        try:
            sale = self.db.query(Sale).filter(Sale.id == request.sale_id).first()
            if not sale:
                return APIResponse.not_found(message=f"Sale ID '{request.sale_id}' not found.")

            ret = Return(**request.model_dump())

            self.db.add(ret)
            self.db.commit()
            self.db.refresh(ret)
            return ret

            # return APIResponse.created(data={
            #     "id": ret.id,
            #     "date": ret.date.isoformat() if ret.date else None,
            #     "quantity": float(ret.quantity) if ret.quantity is not None else None,
            #     "sale_id": ret.sale_id,
            # })

        except Exception as e:
            print("❌ ERROR:", e)
            raise e   
        
        
    def list_return(self, request: ListRequest):
        return_query = self.db.query(Return)
        
        if request.q:
            like = f"%{request.q}%"
            return_query = return_query.filter(
                or_(
                    Return.quantity.ilike(like),
                )
            )
            
        return APIResponse.paginated(
            return_query, request,
            lambda r: {
                "id": r.id,
                "date": r.date.isoformat() if r.date else None,
                "quantity": float(r.quantity) if r.quantity is not None else None,
                "sale_id": r.sale_id,
            }
        )
        
    
    def get_return(self, return_id: int):
        ret = self.db.query(Return).filter(Return.id == return_id).first()
        if not ret:
            return APIResponse.not_found(message=f"Return ID '{return_id}' not found")
        
        return APIResponse.ok(data={
            "id": ret.id,
            "date": ret.date.isoformat() if ret.date else None,
            "quantity": float(ret.quantity) if ret.quantity is not None else None,
            "sale_id": ret.sale_id,
        })
        
        
    def update_return(self, return_id: int, request: ReturnUpdate):
        update_data = request.model_dump(exclude_unset= True)
        
        ret = self.db.query(Return).filter(Return.id == return_id).first()
        if not ret:
            return APIResponse.not_found(message=f"Return ID '{return_id}' not found.")
        
        if "sale_id" in update_data:
            sale = self.db.query(Sale).filter(Sale.id == update_data["sale_id"]).first()
            if not sale:
                return APIResponse.not_found(message=f"Sale ID '{update_data['sale_id']}' not found")
            
        for key, value, in update_data.items():
            setattr(ret, key, value)
            
        self.db.add(ret)
        self.db.commit()
        self.db.refresh(ret)
        
        return APIResponse.ok(f"Return ID '{return_id}' updated.")
    
    
    def delete_return(self, return_id: int):
        ret = self.db.query(Return).filter(Return.id == return_id).first()
        if not ret:
            return APIResponse.not_found(message=f"Return ID '{return_id}' not found.")
        
        self.db.delete(ret)
        self.db.commit()
        
        return APIResponse.ok(f"Return ID '{return_id}' deleted.")