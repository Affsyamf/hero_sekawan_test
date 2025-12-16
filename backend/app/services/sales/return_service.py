from fastapi import Depends, status
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.models import Return, Sale, Product, Client, ColorKitchenEntry, ColorKitchenEntryDetail, Opj
from app.schemas.input_models.sales_input_models import ReturnCreate, ReturnUpdate, ReturnFilter
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters
from datetime import date, datetime

class ReturnService:
    def __init__(self, db=Depends(get_db)):
        self.db = db
        
    
    def create_return(self, request: ReturnCreate):
        try:
            # kode duplikat
            existing_code = self.db.query(Return).filter(
                Return.code == request.code
            ).first()
            
            if existing_code:
                return APIResponse.conflict(
                    message=f"Return with code '{request.code}' alredy exsist"
                )
                
            # validasi opj
            active_opj = self.db.query(Opj).filter(
                Opj.id == request.opj_id,
                Opj.deleted_at.is_(None)
            ).first()
            
            if not active_opj:
                deleted_opj = self.db.query(Opj).filter(Opj.id == request.opj_id).first()
                
                if deleted_opj and deleted_opj.deleted_at is not None:
                    return APIResponse.conflict(
                        message = f"OPJ ID  '{request.opj_id}' has been deleted"
                    )
                else:
                    return APIResponse.not_found(message=f"Opj '{request.opj_id}' not found ")

             
            # validasi sale   
            sale = self.db.query(Sale).filter(Sale.id == request.sale_id).first()
            if not sale:
                return APIResponse.not_found(message=f"Sale ID '{request.sale_id}' not found.")

            # sale.opj_id gaboleh null
            if sale.opj_id is None:
                return APIResponse.conflict(
                    message = f"Sale ID '{request.sale_id}' is not associated with any OPJ"

                )
            
            # sale.opj_id HARUS SAMA DENGAN request.opj_id
            if sale.opj_id != request.opj_id:
                return APIResponse.conflict(
                    message = (
                        f"Sale ID '{request.sale_id}' is associated with OPJ ID "
                        f"'{sale.opj_id}', not '{request.opj_id}'."
                    )
                )     
            
            # validasi opj dari sale
            sale_opj_active = self.db.query(Opj).filter(
                Opj.id == request.opj_id,
                Opj.deleted_at.is_(None)
            ).first()
            
            if not sale_opj_active:
                return APIResponse.conflict(
                    message = f"Opj associated with sale id '{sale.id}' has been deleted "
                )
                
            
            # create rturn
            ret = Return(**request.model_dump())

            self.db.add(ret)
            self.db.commit()
            self.db.refresh(ret)
            # return ret
          
            return APIResponse.created(data={
            "id": ret.id,
            "code": ret.code,
            "sale_id": ret.sale_id,
            "opj_id": ret.opj_id
        })

        except Exception as e:
            self.db.rollback()
            return APIResponse.internal_error(message=str(e))
        
        
    def list_return(self, filters: ReturnFilter):
        return_query = self.db.query(Return)
        
        return_query = return_query.join(Sale, Return.sale_id == Sale.id)\
                               .join(Client, Sale.client_id == Client.id)\
                               .join(Opj, Sale.opj_id == Opj.id)\
                               .join(ColorKitchenEntry, ColorKitchenEntry.opj_id == Opj.id)\
                               .join(ColorKitchenEntryDetail, ColorKitchenEntry.id == ColorKitchenEntryDetail.color_kitchen_entry_id)\
                               .join(Product, ColorKitchenEntryDetail.product_id == Product.id)
        
        return_query = apply_common_report_filters(return_query, filters)
        
        filter_conditions = []
        
        if filters.q:
            like = f"%{filters.q}%"
            filter_conditions.append(
                or_(
                    Return.quantity.ilike(like),
                    Client.name.ilike(like),
                    Product.name.ilike(like)
                )
            )
            
        if filters.start_date:
            filter_conditions.append(Return.date >= filters.start_date)
            
        if filters.end_date:
            filter_conditions.append(Return.date <= filters.end_date)
            
        if filter_conditions:
            return_query = return_query.filter(and_(*filter_conditions))
        
        return_query = return_query.order_by(Return.id.desc())

        return APIResponse.paginated(
            return_query,
            filters,
            lambda r: {
                "id": r.id,
                "code": r.code,
                "date": r.date.isoformat() if r.date else None,
                "opj_id": r.opj_id,
                "quantity": float(r.quantity) if r.quantity else None,
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
        try:
            update_data = request.model_dump(exclude_unset= True)
            
            # cek return   
            ret = self.db.query(Return).filter(Return.id == return_id).first()
            if not ret:
                return APIResponse.not_found(message=f"Return ID '{return_id}' not found.")
        
            # duplikasi code
            if "code" in update_data:
                existing_code = self.db.query(Return).filter(
                    Return.code == update_data["code"],
                    Return.id != return_id
                ).first()
                
                if existing_code:
                    return APIResponse.conflict(
                        message=f"Return Code Cant Update '{request.code}' alredy exsist "
                    )
                    
            # validasi opj
            new_opj_id = update_data.get("opj_id", ret.opj_id)
            
            if "opj_id" in update_data:
                active_opj = self.db.query(Opj).filter(
                    Opj.id == new_opj_id,
                    Opj.deleted_at.is_(None)
                ).first()
                
                if not active_opj:
                    deleted_opj = self.db.query(Opj).filter(Opj.id == new_opj_id).first()
                    
                    if deleted_opj and deleted_opj.deleted_at is not None:
                        return APIResponse.conflict(
                            message = f"OPJ ID '{new_opj_id}' has been deleted"
                        )
                        
                    else:
                        return APIResponse.not_found(
                            message=f"Opj ID '{new_opj_id}' not found"
                        )
                    
                new_opj_id = update_data.get("opj_id", ret.opj_id)

            # validasi sale
            new_sale_id = update_data.get("sale_id", ret.sale_id)

            if "sale_id" in update_data:
                sale = self.db.query(Sale).filter(
                    Sale.id == new_sale_id
                ).first()

                if not sale:
                    return APIResponse.not_found(
                        message=f"Sale ID '{new_sale_id}' not found."
                    )

                if sale.opj_id is None:
                    return APIResponse.conflict(
                        message=f"Sale ID '{new_sale_id}' is not associated with any OPJ."
                    )

            else:
                sale = self.db.query(Sale).filter(
                    Sale.id == new_sale_id
                ).first()
            
            
            # validasi relasi opj ke sale
            if sale and sale.opj_id != new_opj_id:
                return APIResponse.conflict(
                    message=(
                        f"Sale ID '{new_sale_id}' is associated with OPJ ID "
                        f"'{sale.opj_id}', not '{new_opj_id}'."
                    )
                )
                
            # validasi opj dari sale
            if sale:
                sale_opj_active = self.db.query(Opj).filter(
                    Opj.id == sale.opj_id,
                    Opj.deleted_at.is_(None)
                ).first()

                if not sale_opj_active:
                    return APIResponse.conflict(
                        message=f"OPJ associated with Sale ID '{sale.id}' has been deleted."
                    )
            
            # update
            for key, value, in update_data.items():
                setattr(ret, key, value)
                
            self.db.add(ret)
            self.db.commit()
            self.db.refresh(ret)
            
            return APIResponse.ok(f"Return ID '{return_id}' updated.")
        
        except Exception as e:
            self.db.rollback()
            return APIResponse.internal_error(message=str(e))
    
    def delete_return(self, return_id: int):
        ret = self.db.query(Return).filter(Return.id == return_id).first()
        if not ret:
            return APIResponse.not_found(message=f"Return ID '{return_id}' not found.")
        
        self.db.delete(ret)
        self.db.commit()
        
        return APIResponse.ok(f"Return ID '{return_id}' deleted.")