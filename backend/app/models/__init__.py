from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

from .user import *

from .master import *
from .ledger import *
from .purchasing import *
from .stock_movement import *
from .color_kitchen import *
from .stock_opname import *
from .types import *
from .analytics.product_avg_cost import *
from .cache.product_avg_cost_cache import ProductAvgCostCache
from .audit import *
from .mixin.AuditMixin import AuditMixin
from .mixin.TimestampMixin import TimestampMixin

__all__ = [
    "Base",
    # mixin
    "AuditMixin",
    "TimestampMixin",
    # user.py
    "User", "Role", "Permission", "UserLoginLog",
    # master.py
    "Supplier", "Product", "Design",
    # ledger.py
    "Ledger",
    # purchasing.py
    "Purchasing", "PurchasingDetail",
    # stock_movement.py
    "StockMovement", "StockMovementDetail",
    # color_kitchen.py
    "ColorKitchenBatch", "ColorKitchenBatchDetail",
    "ColorKitchenEntry", "ColorKitchenEntryDetail",
    # stock_opname.py
    "StockOpname", "StockOpnameDetail",
    # types.py
    "Account", "DesignType", "AccountParent",
    # audit.py
    "AuditColumnLog",
    # product_avg_cost.py
    "ProductAvgCost",
    # product_avg_cost_cache.py
    "ProductAvgCostCache",
]