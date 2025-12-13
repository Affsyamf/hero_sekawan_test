from fastapi import UploadFile, HTTPException
from io import BytesIO
import pandas as pd
import uuid
from datetime import datetime

from app.services.imports.import_cache import IMPORT_PREVIEW_CACHE

class BaseImportService:
    def __init__(self, db):
        self.db = db
        self.errors = []
        self.inserted = 0
        self.skipped = 0

    def create_preview(self, payload: dict) -> str:
        preview_id = str(uuid.uuid4())
        IMPORT_PREVIEW_CACHE[preview_id] = {
            "created_at": datetime.utcnow(),
            "payload": payload,
        }
        return preview_id

    def get_preview(self, preview_id: str) -> dict:
        item = IMPORT_PREVIEW_CACHE.get(preview_id)
        if not item:
            raise HTTPException(status_code=404, detail="Preview expired or not found")
        return item["payload"]

    def consume_preview(self, preview_id: str) -> dict:
        payload = self.get_preview(preview_id)
        del IMPORT_PREVIEW_CACHE[preview_id]
        return payload

    def read_excel(self, file: UploadFile) -> pd.DataFrame:
        """Default reader (simple one-sheet flat file). Override if needed."""
        try:
            return pd.read_excel(BytesIO(file.file.read()))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

    def log_error(self, row, msg):
        self.errors.append({"row": row, "error": msg})

    def summary(self):
        return {
            "inserted": self.inserted,
            "skipped": self.skipped,
            "errors": self.errors,
        }