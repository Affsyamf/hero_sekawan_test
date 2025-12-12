from fastapi import APIRouter, HTTPException, Depends

from app.schemas.input_models.client_input_models import ClientCreate, ClientUpdate
from app.utils.datatable.request import ListRequest
from app.services.master.client_service import ClientService
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user
from app.models.user import User

client_router = APIRouter(prefix="/client", tags=["Master Client"], dependencies=[require_user()])

@client_router.get("/search")
def search_clients(request: ListRequest = Depends(), service: ClientService=Depends()):
    return service.list_client(request=request)

@client_router.get("/{client_id}")
def get_client_by_id(client_id: int, service: ClientService= Depends()):
    return service.get_client(client_id=client_id)
    
@client_router.post("/")
def create_client(request: ClientCreate, service: ClientService = Depends()):
    try:
        return service.create_client(request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to create client", error_detail=str(e))
    
@client_router.put("/{client_id}")
def update_client_by_id(client_id: int, request: ClientUpdate, service: ClientService = Depends()):
    try:
        return service.update_client(client_id, request)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to update account", error_detail=str(e))

@client_router.delete("/{client_id}")
def delete_client_by_id(client_id: int, service: ClientService = Depends()):
    try:
        return service.delete_client(client_id)
    except Exception as e:
        return APIResponse.internal_error(message="Failed to delete client", error_detail=str(e))