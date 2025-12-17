from sqlalchemy.orm import Query
from app.models import Product, Purchasing, Account, AccountParent, Design, ColorKitchenEntry, Client, Sale, Opj

def get_field(name, filters):
    return filters.get(name) if isinstance(filters, dict) else getattr(filters, name, None)

def apply_common_report_filters(query: Query, filters) -> Query:
    """Apply generic filters (product, supplier, account, category) to any report query."""

    product_ids = get_field("product_ids", filters)
    supplier_ids = get_field("supplier_ids", filters)
    account_parent_ids = get_field("account_parent_ids", filters)
    account_ids = get_field("account_ids", filters)
    category = get_field("category", filters)
    design_ids = get_field("design_ids", filters)
    ck_ids = get_field("ck_ids", filters)
    client_ids = get_field("client_ids", filters)
    sale_ids = get_field("sale_ids", filters)
    opj_ids = get_field("opj_ids", filters)

    if sale_ids:
        query = query.filter(Sale.id.in_(sale_ids))
        
    if product_ids:
        query = query.filter(Product.id.in_(product_ids))

    if supplier_ids:
        query = query.filter(Purchasing.supplier_id.in_(supplier_ids))

    if account_parent_ids:
        query = query.filter(Account.parent_id.in_(account_parent_ids))

    if account_ids:
        query = query.filter(Account.id.in_(account_ids))
        
    if design_ids:
        query = query.filter(Design.id.in_(design_ids))
        
    if opj_ids:
        query = query.filter(Opj.id.in_(opj_ids))
        
    if ck_ids:
        query = query.filter(ColorKitchenEntry.id.in_(ck_ids))
    if client_ids:
        query = query.filter(Client.id.in_(client_ids))
        
    if category:
        if category in ("chemical", "sparepart"):
            query = query.filter(AccountParent.account_type == category)
        elif category == "both":
            query = query.filter(AccountParent.account_type.in_(["chemical", "sparepart"]))

    return query