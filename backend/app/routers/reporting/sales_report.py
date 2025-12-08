# app/routes/reporting_routes.py (Contoh, tambahkan ke file routes reporting Anda)

from fastapi import APIRouter, Depends
from app.schemas.input_models.sales_input_models import SalesFilter 
from app.schemas.filter_models.report_filters import SalesReportFilter
from app.schemas.report_response.reporting_schemas import SalesSummaryResponse 
from app.services.reporting.sales.sales_summary_service import SalesSummaryService 
from app.utils.response import APIResponse
from app.dependencies.rbac import require_user 

router = APIRouter(prefix="/report/sales", tags=["Reports/Sales"], dependencies=[require_user()])


@router.post("/summary")
def get_sales_summary(filters: SalesReportFilter, service: SalesSummaryService = Depends()):
    return service.run(filters)
