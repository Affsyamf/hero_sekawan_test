# app/routes/reporting_routes.py (Contoh, tambahkan ke file routes reporting Anda)

from fastapi import APIRouter, Depends
from app.schemas.input_models.sales_input_models import SalesFilter 
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesSummaryResponse, SalesClientTopResponse
from app.services.reporting.sales.sales_client_top_service import SalesClientTopService
from app.services.reporting.sales.sales_summary_service import SalesSummaryService 
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user 

router = APIRouter(prefix="/report/sales", tags=["Reports/Sales"], dependencies=[require_user()])


@router.post("/summary", response_model=SalesSummaryResponse)
def get_sales_summary(filters: SalesReportFilter, service: SalesSummaryService = Depends()):
    return service.run(filters)


@router.post("/client-top", response_model=SalesClientTopResponse)
def get_client_top(filters: SalesReportFilter, service: SalesClientTopService = Depends()):
    return service.run(filters)
    
