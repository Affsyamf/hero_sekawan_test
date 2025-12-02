from fastapi.params import Depends
from sqlalchemy import or_

from app.schemas.input_models.client_input_models import ClientCreate, ClientUpdate
from app.services.common.audit_logger import AuditLoggerService
from app.core.database import Session, get_db
from app.models import Client
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse

class ClientService:
    def __init__(self, db = Depends(get_db)):
        self.db = db
        
    def create_client(self, request: ClientCreate):
        existing = self.db.query(Client).filter(Client.name == request.name).first()
        if existing:
            return APIResponse.conflict(message=f"client with name '{request.name}' already exists.")
        
        client = Client(**request.model_dump())
        
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        
        return APIResponse.created(data={"id": client.id,  "name": client.name})
    
    
    def list_client(self, request: ListRequest):
        client_query = self.db.query(Client)
        
        if request.q:
            like = f"%{request.q}%"
            client_query = client_query.filter(
                or_(
                    Client.name.ilike(like),
                    Client.address.ilike(like),
                )
            )
            
        return APIResponse.paginated(
            client_query, request, lambda client: {
            "id": client.id,
            "name": client.name,
            "address": client.address,
            "phone_no": client.phone_no,
        })
            
    def get_client(self, client_id: int):
        client = self.db.query(Client).filter(Client.id == client_id).first()
        
        if not client:
            return APIResponse.not_found(message=f"Client ID '{client_id}' not found.")
            
        response = {
            "id": client.id,
            "name": client.name,
            "address": client.address,
            "phone_no": client.phone_no,
        }
        
        return APIResponse.ok(data=response)
        
    def update_client(self, client_id: int, request: ClientUpdate):
        update_data = request.model_dump(exclude_unset=True)
        
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return APIResponse.not_found(message=f"Client ID  '{client_id}' not found.")
            
        if "name" in update_data:
            existing = self.db.query(Client).filter(
                Client.name == update_data["name"],
                Client.id != client_id
            ).first()
            
            if existing:
                return APIResponse.conflict(message=f"Client with name '{update_data['name']}' already exists.")
            
            if update_data:
                for key, value in update_data.items():
                    setattr(client, key, value)
                    
                self.db.add(client)
                self.db.flush()
                
            return APIResponse.ok(f"Client ID '{client_id}' updated.")
            
    def delete_client(self, client_id: int):
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            return APIResponse.not_found(message=f"Client ID '{client_id}' not found.")
            
        self.db.delete(client)
        self.db.commit()
        
        return APIResponse.ok(f"Client ID '{client_id}' deleted.")