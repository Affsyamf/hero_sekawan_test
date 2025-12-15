from typing import Optional
from pydantic import BaseModel, validator, field_validator, model_validator


class ListRequest(BaseModel):
    page: Optional[int] = 1
    page_size: Optional[int] = 10
    q: Optional[str] = None
    require_filter: Optional[bool] = False  # opsional, default False
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    
    sort_by: Optional[str] = None
    sort_dir: Optional[str] = None
    
    @field_validator("page")
    @classmethod
    def validate_page(cls, v):
        return max(int(v or 1), 1)

    @field_validator("page_size")
    @classmethod
    def validate_page_size(cls, v):
        return min(int(v or 10), 100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def search_str(self) -> str:
        return (self.q or "").strip()

    # ✅ Model validator untuk cek filter wajib
    @model_validator(mode="after")
    def check_required_filter(self):
        if self.require_filter and not self.q:
            raise ValueError("Filter is required but missing")
        return self