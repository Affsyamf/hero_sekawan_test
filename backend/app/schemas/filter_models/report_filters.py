from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

class BaseReportFilter(BaseModel):
    start_date: Optional[datetime] = Field(None, description="Filter from date (inclusive)")
    end_date: Optional[datetime] = Field(None, description="Filter to date (inclusive)")
    
class PurchasingReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )
    category: Optional[Literal["chemical", "sparepart", "both"]] = Field(
        None,
        description=(
            "Filter purchasing by category. "
            "'chemical' = only chemicals, "
            "'sparepart' = only spareparts, "
            "'both' = chemical + sparepart, "
            "None = all"
        ),
    )
    product_ids: Optional[List[int]] = Field(
        None, description="Filter by list of Product IDs"
    )
    supplier_ids: Optional[List[int]] = Field(
        None, description="Filter by list of Supplier IDs"
    )
    account_parent_ids: Optional[List[int]] = Field(
        None, description="Filter by list of AccountParent id"
    )

class ColorKitchenReportFilter(BaseReportFilter):
    granularity: Optional[str] = Field(
        "monthly",
        description="Data aggregation level: daily, weekly, monthly, yearly"
    )
    product_ids: Optional[List[int]] = Field(
        None, description="Filter by list of Product IDs"
    )
    supplier_ids: Optional[List[int]] = Field(
        None, description="Filter by list of Supplier IDs"
    )
    chemical_type: Optional[Literal["DYE", "AUX", "BOTH"]] = Field(
        None, description="Filter by chemical type: 'DYE', 'AUX', or 'BOTH'"
    )
    account_ids: Optional[List[int]] = Field(
        None, description="Filter by Account ids"
    )
    
    
class SalesReportFilter(BaseReportFilter):
    client_ids: Optional[List[int]] = Field(
        None, description="Filter by list of Client ID"
    )
    ck_ids: Optional[List[int]] = Field(
        None, description="Filter by list of CK ID"
    )
    design_ids: Optional[List[int]] = Field(
        None, description="filter by list of design id (via ck)"
    )
    granularity: Optional[str] = Field(
        "monthly", description="Data level: daily, weekly, monthly, yearly"
    )