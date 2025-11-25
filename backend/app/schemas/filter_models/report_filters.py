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
    account_parent_codes: Optional[List[int]] = Field(
        None, description="Filter by list of AccountParent codes (e.g. 1105201)"
    )
    account_names: Optional[List[str]] = Field(
        None, description="Filter by Account.name list or partial matches"
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