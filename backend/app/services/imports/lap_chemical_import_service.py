from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime, date
from io import BytesIO
import pandas as pd
import math, re
from collections import defaultdict
from fastapi import HTTPException
from openpyxl import load_workbook

from app.models import (
    Product,
    StockMovement, 
    StockMovementDetail,
    ProductAvgCostCache
)

from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.cost_helper import get_avg_cost_for_product
from app.utils.response import APIResponse

class LapChemicalImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]

        inserted = {"movements": 0, "details": 0, "skipped": 0, "errors": []}
        movements_map = {}  # (code, date) -> StockMovement

        for idx, row in enumerate(rows):
            excel_row = idx + 5  # offset since header=4

            code = row["code"]
            tanggal = row["date"]
            qty = row["quantity"]
            nama_brg = product["product_name"]

            # --- Required fields check ---
            if not code or not tanggal or qty is None or not nama_brg:
                inserted["skipped"] += 1
                continue

            # --- find product ---
            product = self.db.query(Product).filter_by(name=nama_brg.upper()).first()
            if not product:
                inserted["errors"].append(
                    {
                        "row": excel_row, 
                        "reason": f"product not found: {nama_brg}", 
                        "code": code, 
                        "qty": qty
                    }
                )
                continue

            # --- fetch cached avg cost ---
            unit_cost = get_avg_cost_for_product(self.db, product.id)
            if unit_cost is None:
                inserted["errors"].append({
                    "row": excel_row,
                    "reason": f"no cached avg cost for product: {nama_brg}",
                    "product_id": product.id,
                    "code": code,
                    "qty": qty
                })
                inserted["skipped"] += 1
                continue

            # --- reuse or create Stock_Movement ---
            key = (code, tanggal)
            if key not in movements_map:
                movement = StockMovement(date=tanggal, code=code)
                self.db.add(movement)
                self.db.flush()  # ensure movement.id available
                movements_map[key] = movement
                inserted["movements"] += 1
            else:
                movement = movements_map[key]

            # --- create StockMovementDetail ---
            detail = StockMovementDetail(
                quantity=qty,
                product_id=product.id,
                stock_movement_id=movement.id,
                unit_cost_used=unit_cost,
            )
            self.db.add(detail)
            inserted["details"] += 1

        return inserted
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        df = pd.read_excel(
            BytesIO(contents),
            sheet_name="CHEMICAL",
            header=4
        )
        df = df.iloc[:, :-2]

        summary = {
            "preview_id": 0,
            "total_rows": len(df),
            "valid_rows": 0,
            "skipped": 0,
            "errors": [],
            "movements": [],
        }

        movements_map = defaultdict(lambda: {"date": None, "code": None, "details": []})
        parsed_rows = []

        for idx, row in df.iterrows():
            excel_row = idx + 5
            code = safe_str(row.get("NOBUKTI"))
            tanggal = safe_date(row.get("TANGGAL"))
            qty = safe_number(row.get("QTY"))
            nama_brg = safe_str(row.get("NAMABRG"))

            if not code or not tanggal or qty is None or not nama_brg:
                summary["skipped"] += 1
                continue

            product = self.db.query(Product).filter_by(name=nama_brg.upper()).first()
            if not product:
                summary["errors"].append(
                    {"row": excel_row, "reason": f"product not found: {nama_brg}", "code": code, "qty": qty}
                )
                continue

            unit_cost = get_avg_cost_for_product(self.db, product.id)
            if unit_cost is None:
                summary["errors"].append({
                    "row": excel_row,
                    "reason": f"no cached avg cost for product: {nama_brg}",
                    "product_id": product.id,
                    "code": code,
                    "qty": qty
                })
                summary["skipped"] += 1
                continue

            parsed_rows.append({
                "code": code,
                "date": tanggal,
                "product_name": product.name,
                "quantity": qty,
                "unit_cost": unit_cost
            })

            key = (code, tanggal)
            if movements_map[key]["code"] is None:
                movements_map[key]["code"] = code
                movements_map[key]["date"] = tanggal

            movements_map[key]["details"].append({
                "product_name": nama_brg,
                "quantity": qty,
                "unit_cost_used": unit_cost,
                "total_cost": round(qty * unit_cost, 2),
            })
            summary["valid_rows"] += 1

        # ✅ Convert both datetime *and* date to string safely
        movements = []
        for m in movements_map.values():
            if isinstance(m["date"], (datetime, date)):
                m["date"] = m["date"].isoformat()
            movements.append(m)

        summary["movements"] = movements
        summary["total_movements"] = len(movements)

        preview_id = self.create_preview({
            "rows": parsed_rows
        })
        summary["preview_id"] = preview_id

        return APIResponse.ok(data=summary)
    