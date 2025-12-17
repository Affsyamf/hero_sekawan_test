from sqlalchemy.orm import Query, Session
from app.models import Sale, Client, ColorKitchenEntry, Design, Opj
from datetime import date, datetime
from typing import Any
from decimal import Decimal


def sale_joins(query:Query) -> Query:
    return(
        query.join(Opj, Sale.opj_id == Opj.id)\
             .join(ColorKitchenEntry, ColorKitchenEntry.opj_id == Opj.id )\
             .join(Client, Sale.client_id == Client.id)\
             .join(Design, Opj.design_id == Design.id)
    )
    
def date_filter(query:Query, start_date: date, end_date: date, model: any) -> Query:
    date_col = getattr(model, "date", None)
    if not date_col:
        return query
    if start_date:
        query = query.filter(date_col >= start_date)
    if end_date:
        query = query.filter(date_col <= end_date)
    return query

def to_float(v: Any) -> float:
    return float(v) if isinstance(v, (Decimal, int)) else v


def normalize_report_filters(filters_dict: dict) -> dict:
    cleaned_filters = {}
    for k, v in filters_dict.items():
        if k in ["start_date", "end_date"] and v is not None:
            # Mengkonversi objek datetime ke objek date 
            if isinstance(v, datetime):
                cleaned_filters[k] = v.date()
            elif isinstance(v, date):
                cleaned_filters[k] = v
            else:
                cleaned_filters[k] = v
        else:
            # Memastikan nilai None atau non-date disalin langsung
            cleaned_filters[k] = v
    return cleaned_filters