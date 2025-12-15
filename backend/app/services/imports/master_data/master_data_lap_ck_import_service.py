from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from io import BytesIO
import pandas as pd
import math
from openpyxl import load_workbook

from app.models import (
    Design,
    DesignType
)

from app.utils.normalise import normalise_design_name, normalise_design_type
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.response import APIResponse

class MasterDataLapCkImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def get_or_create_design_type(self, raw_value: str):
        normalized = normalise_design_type(raw_value)
        dtype = self.db.query(DesignType).filter_by(name=normalized).first()
        if not dtype:
            dtype = DesignType(name=normalized)
            self.db.add(dtype)
            self.db.flush()  # assign ID before commit
        return dtype

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]

        seen = set()
        added, skipped, unknown = 0, 0, []
        

        for row in rows:
            code = row["code"]
            type_name = row["type"]

            if code in seen:
                continue
            seen.add(code)

            # skip if design already exists
            if self.db.query(Design).filter_by(code=code).first():
                continue

            dtype = self.db.query(DesignType).filter_by(name=type_name).first()
            if not dtype:
                dtype = DesignType(name=type_name)
                self.db.add(dtype)
                self.db.flush()

            self.db.add(Design(code=code, type=dtype))
            added += 1

        return {
            "added": added,
        }
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        df = pd.read_excel(
            BytesIO(contents),
            sheet_name="TEMPLATE QTY",
            header=2,
            usecols="A:E",
        )

        seen = set()
        to_insert, existing, skipped = [], [], []
        missing_types = set()

        rows_flat = []

        for _, row in df.iterrows():
            opj = row.get("OPJ")
            if pd.isna(opj):
                continue

            code = normalise_design_name(str(row.get("DESIGN") or ""))
            type_raw = str(row.get("JENIS KAIN") or "")

            if not code or not type_raw:
                continue

            if code in seen:
                skipped.append(code)
                continue
            seen.add(code)

            normalized_type = normalise_design_type(type_raw)
            dtype = self.db.query(DesignType).filter_by(name=normalized_type).first()
            if not dtype:
                missing_types.add(normalized_type)

            existing_design = self.db.query(Design).filter_by(code=code).first()
            if existing_design:
                existing.append({"code": code, "type": normalized_type})
            else:
                to_insert.append({"code": code, "type": normalized_type})

            rows_flat.append({
                "code": code,
                "type": normalise_design_type(type_raw),
            })

        preview_id = self.create_preview({
            "rows": rows_flat
        })

        return APIResponse.ok(
            data={
                "preview_id": preview_id,
                "summary": {
                    "total_rows": len(df),
                    "to_insert": len(to_insert),
                    "existing": len(existing),
                    "skipped": len(skipped),
                    "missing_types": sorted(list(missing_types)),
                },
                "insert_samples": to_insert[:30],
                "existing_samples": existing[:30],
                "skipped_samples": skipped[:20],
            }
        )