from typing import Any, Dict, List, TypeVar, Generic
class ListResponse:
    def __init__(self, data: List[Dict[str, Any]], total: int, page: int, page_size: int):
        self.data = data
        self.total = total
        self.page = page
        self.page_size = page_size

    def dict(self) -> Dict[str, Any]:
        return {
            "data": self.data,
            "total": self.total,
            "page": self.page,
            "page_size": self.page_size,
        }
