from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional, List
from datetime import date, datetime
class SalesSummaryResponse(BaseModel):
    """Schema for the Sales Reporting Summary Data (Output)."""
   
    total_sales: int = Field(..., description="Total count of sales transactions.")
    total_returns: int = Field(..., description="Total count of return transactions.")
    
    total_payments: float = Field(..., description="Total value of all received payments.")
    
    total_receivable: float = Field(None, description="Total outstanding receivables (Piutang).")
    # total_receivable: Decimal = Field(..., description="Total outstanding receivables (Piutang).")

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: lambda v: float(v)
        }
        

class ClientSalesData(BaseModel):
    id: int
    name: str
    value: float = Field(..., description="Total quantity (SUM of quantity_end) sold to this client.")
    
class SalesClientTopResponse(BaseModel):
    results: List[ClientSalesData] = Field(..., description="List of top clients by sales quantity.")
    
class SalesDropClientData(BaseModel):
    client_id: int = Field(..., description="ID of the client")
    client_name: str = Field(..., description="Name of the client")
    time_period: str = Field(..., description="Time period of the sales drop")
    total_sales: float = Field(..., description="Total sales during this period")
    prev_sales: Optional[float] = Field(None, description="Total sales in the previous period")
    sales_growth: Optional[float] = Field(None, description="Growth percentage compared to previous period")
    
class SalesDropClientResponse(BaseModel):
    results: List[SalesDropClientData] = Field(..., description="List of clients with sales drop data")

class SalesTrendData(BaseModel):
    time_period: str = Field(..., description="Start aggregation month/week")
    total_quantity: float = Field(..., description="Total Quantity sold during this period")
    
class SalesTrendResponse(BaseModel):
    results: List[SalesTrendData] = Field(..., description="List of sales trend")
    
class PurchasingSalesTrendData(BaseModel):
    time_period: str = Field(..., description="Start aggregation month/week")
    total_purchasing: float = Field(..., description="Total Purchasing Value during this period")
    total_sales: float = Field(..., description="Total Sales Value during this period")

class PurchasingSalesTrendResponse(BaseModel):
    results: List[PurchasingSalesTrendData] = Field(..., description="List of purchasing and sales trend")

class PaymentReceivableTrend(BaseModel):
    time_period: str = Field(..., description="Start aggregation period")
    total_payment: float = Field(..., description="Total Value of payments")
    total_receivable: Optional[float] = Field(None, description="Total receivable during this period")
    
class PaymentReceivableResponse(BaseModel):
    results: List[PaymentReceivableTrend] = Field(..., description="List of payment and receivable trend")