import contextvars
from app.context.event_context import _skip_cost_cache_update

# Context variable (thread-safe, works inside async or multi-threaded env)
# _skip_cost_cache_update = contextvars.ContextVar("_skip_cost_cache_update", default=False)

def skip_cost_cache_updates():
    """Context manager to temporarily disable avg cost cache updates."""
    class _Skip:
        def __enter__(self_inner):
            _skip_cost_cache_update.set(True)
        def __exit__(self_inner, exc_type, exc_val, exc_tb):
            _skip_cost_cache_update.set(False)
    return _Skip()

def should_skip_cost_cache_updates():
    return _skip_cost_cache_update.get()