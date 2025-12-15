from cachetools import TTLCache

IMPORT_PREVIEW_CACHE = TTLCache(
    maxsize=100,
    ttl=60 * 10  # 10 minutes
)