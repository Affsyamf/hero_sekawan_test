from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import joinedload

from app.models.user import User
from app.dependencies.auth_dependency import AuthDependency

from app.schemas.input_models.types_input_models import AccountCreate, AccountUpdate, AccountFilter
from app.core.database import Session, get_db
from app.models import Account, Product, AccountParent, Purchasing, PurchasingDetail, Supplier
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse
from app.utils.filters import apply_common_report_filters

class AccountService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_account(self, filters: AccountFilter):
        account_query = self.db.query(Account)
        
        account_query = account_query.join(Product, Product.account_id == Account.id)\
                                     .join(PurchasingDetail, Product.id == PurchasingDetail.product_id)\
                                     .join(Purchasing, PurchasingDetail.purchasing_id == Purchasing.id)\
                                     .join(Supplier, PurchasingDetail.purchasing_id == Purchasing.id)\
                                     .outerjoin(AccountParent, Account.parent_id == AccountParent.id)
                    
        account_query = apply_common_report_filters(account_query, filters)
        
        filter_conditions = []
        
        if filters.q:
            like = f"%{filters.q}%"
            filter_conditions.append(
                or_(
                    Account.name.ilike(like),
                    Product.name.ilike(like),
                    Supplier.name.ilike(like),
                )
            )
            
        if filter_conditions:   
            account_query = account_query.filter(and_(*filter_conditions))
            
        account_query = account_query.group_by(Account.id)
        
        account_query = account_query.order_by(Account.id)

        return APIResponse.paginated(account_query, filters, lambda account: {
                "id": account.id,
                "name": account.name,
                "account_no": str(account.parent.account_no) if account.parent else None,
                # "products": [{
                #     "id": product.id,
                #     "code": product.code,
                #     "name": product.name,
                #     "name": product.name,
                # } for product in account.products] if account.products else []
            }
        )

    def get_account(self, account_id: int):
        account = self.db.query(Account).outerjoin(Account.parent).filter(Account.id == account_id).first()

        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        response = {
            "id": account.id,
            "name": account.name,
            "account_no": str(account.parent.account_no) if account.parent else None,
            "account_type": account.parent.account_type if account.parent else None,
            # "alias": account.alias,
            "products": [{
                    "id": product.id,
                    "code": product.code,
                    "name": product.name,
                    "name": product.name,
            } for product in account.products] if account.products else []
        }

        return APIResponse.ok(data=response)

    def create_account(self, request: AccountCreate):

        parent_exists = self.db.query(AccountParent).filter(
            AccountParent.id == request.parent_id
        ). first()
        
        if not parent_exists:
            return APIResponse.not_found(message=f"Account Parent ID '{request.parent_id}' not found.")

        existing_name = self.db.query(Account).filter(Account.name == request.name).first()
        if existing_name:
            return APIResponse.conflict(message=f"Account Name '{request.name}' already exists.")
        
        # ubah menjadi dict
        data_to_create = request.model_dump(exclude_unset=True)
        
        # ke fk
        data_to_create["parent_id"] = parent_exists.id
        
        # objek orm sqlalchemu
        account = Account(**data_to_create)
        
        self.db.add(account)
        self.db.flush()
        self.db.refresh(account)
        return APIResponse.created(data={"id": account.id, "name": account.name})
    
    def update_account(self, account_id: int, request: AccountUpdate):
        update_data = request.model_dump(exclude_unset=True)

        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        # if "account_no" in update_data:
        #     existing = self.db.query(Account).filter(
        #         Account.account_no == update_data["account_no"],
        #         Account.id != account_id
        #     ).first()
        #     if existing:
        #         return APIResponse.conflict(message=f"Account number '{update_data['account_no']}' already exists.")

        if "parent_id" in update_data:
            parent_exists = self.db.query(AccountParent).filter(
                AccountParent.id == update_data["parent_id"]
            ). first()
            
            if not parent_exists:
                return APIResponse.not_found(message=f"Account Parent ID '{update_data['parent_id']}' not found.")  
        
        result = (
            self.db.query(Account)
                .filter(Account.id == account_id)
                .update(update_data, synchronize_session=False)
        )

        if result == 0:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")
 
        return APIResponse.ok(f"Account ID '{account_id}' updated.")
    

    def delete_account(self, account_id: int):
        account = self.db.query(Account).filter(Account.id == account_id).first()
        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        product_count = self.db.query(Product).filter(Product.account_id == account_id).count()

        if product_count > 0:
            msg = (
                "Account tidak bisa dihapus karena sudah digunakan pada data lain: "
                f"{product_count} Product."
            )
            return APIResponse.conflict(message=msg)

        self.db.delete(account)

        return APIResponse.ok(f"Account ID '{account_id}' deleted.")