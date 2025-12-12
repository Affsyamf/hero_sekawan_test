from typing import Optional, List, Union
from pydantic import BaseModel, Field, constr, conint


class ClientCreate(BaseModel):
    name: constr(strip_whitespace=True, min_length=1) = Field(..., description="Name of the client")
    address: Optional[str] = Field(None, description="Address of the client")
    phone_no: Optional[str] = Field(None, description="Phone number of the client")
    
class ClientUpdate(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=1)] = Field(None, description="Name of the client")
    address: Optional[str] = Field(None, description="Address of the client")
    phone_no: Optional[str] = Field(None, description="Phone number of the client")