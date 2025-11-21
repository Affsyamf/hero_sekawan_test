from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_

from datetime import datetime
from app.schemas.input_models.types_input_models import AccountParentCreate, AccountParentUpdate
from app.core.database import Session, get_db
from app.models import AccountParent, Product, Account
from app.utils.datatable.request import ListRequest
from app.utils.deps import DB
from app.utils.response import APIResponse

from app.utils.safe_parse import sanitize

class AccountParentService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_account_parent(self, request: ListRequest):
    
        account_parent = self.db.query(AccountParent)

        if request.q:
            like = f"%{request.q}%"
            account_parent = account_parent.filter(
                or_(
                    AccountParent.name.ilike(like),
                )
            ).order_by(AccountParent.id)

        return APIResponse.paginated(
            account_parent, request,
            lambda ap: sanitize({
                "id": ap.id,
                "name": ap.name,
                "account_no": ap.account_no,
                "account_type": ap.account_type,
                "accounts": [{
                    "id": a.id,
                    "name": a.name,
                } for a in ap.accounts] if ap.accounts else []
            })
        )

    def get_account_parent(self, account_id: int):
        account_parent = self.db.query(AccountParent).filter(AccountParent.id == account_id).first()

        if not account_parent:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        response = {
            "id": account_parent.id,
            "name": account_parent.name,
            "account_no": account_parent.account_no,
            "account_type": account_parent.account_type,
            "accounts": [{
                "id": account.id,
                "name": account.name,
            } for account in account_parent.accounts] if account_parent.accounts else []
        }

        return APIResponse.ok(data=response)

# afif
    def create_account_parent(self, request: AccountParentCreate):
        existing = self.db.query(AccountParent).filter(AccountParent.account_no == request.account_no).first()
        if existing:
            return APIResponse.conflict(message=f"AccountParent number '{request.account_no}' already exists.")

        data_to_create = request.model_dump(
            # konversi ke dict | yg tidak diisi user tidak akan muncul
            exclude={"accounts"}, exclude_unset=True)
        
        # karna blm ada user management, pakai user_id 1 sebagai created_by & updated_by
        user_id = 1
        data_to_create["created_by"] = user_id
        data_to_create["updated_by"] = user_id
        
        now = datetime.now()
        data_to_create["created_at"] = now
        data_to_create["updated_at"] = now
        
        # agar bersih dari accounts saat create karna account sudah di exclude
        account_parent = AccountParent(**data_to_create)
        
        self.db.add(account_parent)
        self.db.flush() 
        self.db.refresh(account_parent)
        
        return APIResponse.created(data={"id": account_parent.id, "account_no": str(account_parent.account_no)})

# afif hanya menambah exclude accounts
    def update_account_parent(self, account_id: int, request: AccountParentUpdate):
        update_data = request.model_dump( exclude={"account"}, exclude_unset=True)

        account = self.db.query(AccountParent).filter(AccountParent.id == account_id).first()
        if not account:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")

        if "account_no" in update_data:
            existing = self.db.query(AccountParent).filter(
                AccountParent.account_no == update_data["account_no"],
                AccountParent.id != account_id
            ).first()
            if existing:
                return APIResponse.conflict(message=f"AccountParent number '{update_data['account_no']}' already exists.")
            
        result = (
            self.db.query(AccountParent)
                .filter(AccountParent.id == account_id)
                .update(update_data, synchronize_session=False)
        )

        if "accounts" in request.model_dump(exclude_unset=True):
            account.accounts = []
            for acc_id in update_data["accounts"]:
                acc = self.db.query(Account).filter(Account.id == acc_id).first()
                if acc:
                    account.accounts.append(acc)

        if result == 0:
            return APIResponse.not_found(message=f"Account ID '{account_id}' not found.")
        
        return APIResponse.ok(f"Account ID '{account_id}' updated.")

# afif
    def delete_account_parent(self, account_id: int):
        account_parent = (self.db.query(AccountParent)
        .filter(AccountParent.id == account_id)
        .populate_existing()
        .first())
        
        if not account_parent:
            return APIResponse.not_found(message=f"AccountParent ID '{account_id}' not found.")

        account_count = self.db.query(Account).filter(Account.parent_id == account_id).count()

        if account_count > 0:
            msg = (
                "AccountParent tidak bisa dihapus karena masih memiliki Account Anak : "
                f"{account_count} Account."
            )
            return APIResponse.conflict(message=msg)

        self.db.delete(account_parent)
        
        return APIResponse.ok(f"AccountParent ID '{account_id}' deleted.")