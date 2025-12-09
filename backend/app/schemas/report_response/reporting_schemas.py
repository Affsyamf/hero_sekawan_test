from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional, List

class SalesSummaryResponse(BaseModel):
    """Schema for the Sales Reporting Summary Data (Output)."""
   
    total_sales: int = Field(..., description="Total count of sales transactions.")
    total_returns: int = Field(..., description="Total count of return transactions.")
    
    total_payments: Decimal = Field(..., description="Total value of all received payments.")
    
    total_receivable: Optional[float] = Field(None, description="Total outstanding receivables (Piutang).")
    # total_receivable: Decimal = Field(..., description="Total outstanding receivables (Piutang).")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
        

class ClientSalesData(BaseModel):
    client_id: int
    client_name: str
    total_quantity: float = Field(..., description="Total quantity (SUM of quantity_end) sold to this client.")
    
class SalesClientTopResponse(BaseModel):
    results: List[ClientSalesData] = Field(..., description="List of top clients by sales quantity.")