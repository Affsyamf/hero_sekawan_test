from fastapi import HTTPException

from app.models.cache.product_avg_cost_cache import ProductAvgCostCache
from app.models.analytics.product_avg_cost import  ProductAvgCost


def get_product_avg_cost(db, product_id: int):
    """
    Mendapatkan average cost dari:
    1. Cache (ProductAvgCostCache)
    2. Histori terakhir (ProductAvgCost)
    """

    # cek cache dulu 
    cache = (
        db.query(ProductAvgCostCache)
        .filter(ProductAvgCostCache.product_id == product_id)
        .first()
    )

    if cache:
        return cache.avg_cost

    # ambil histori terakhir
    last_cost = (
        db.query(ProductAvgCost)
        .filter(ProductAvgCost.product_id == product_id)
        .order_by(ProductAvgCost.id.desc())
        .first()
    )

    if not last_cost:
        raise HTTPException(
            status_code=400,
            detail=f"Avg cost untuk product_id {product_id} belum tersedia."
        )

    return last_cost.avg_cost