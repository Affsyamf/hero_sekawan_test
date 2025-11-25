from contextvars import ContextVar

_skip_cost_cache_update = ContextVar("_skip_cost_cache_update", default=False)
_force_hard_delete = ContextVar("_force_hard_delete", default=False)