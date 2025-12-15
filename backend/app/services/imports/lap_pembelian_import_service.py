from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from io import BytesIO
import pandas as pd
import math
from openpyxl import load_workbook

from app.models import (
    Product,
    Supplier, 
    Purchasing, 
    PurchasingDetail
)

from app.utils.normalise import normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.cost_helper import update_avg_cost_for_products, refresh_product_avg_cost
from app.utils.event_flags import skip_cost_cache_updates
from app.utils.response import APIResponse

class LapPembelianImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]

        purchasings_map = {}
        affected_product_ids = set()

        with skip_cost_cache_updates():
            for row in rows:
                product_name = row["product"]

                # --- collect required fields ---
                kode_supplier = row["supplier"] 
                tanggal = safe_date(row.get("tanggal"))
                no_bukti = row["no_bukti"]

                # --- supplier check ---
                supplier = self.db.query(Supplier).filter_by(code=kode_supplier).first()
                if not supplier:
                    supplier = Supplier(
                        code=kode_supplier,
                        name=kode_supplier,   # or use row.get("NAMA SUPPLIER") if exists
                    )
                    self.db.add(supplier)
                    self.db.flush()

                # --- purchasing key ---
                key = (no_bukti if no_bukti else tanggal, kode_supplier)
                if key not in purchasings_map:
                    purchasing = Purchasing(
                        date=tanggal,
                        code=no_bukti,
                        purchase_order=row["purchase_order"],
                        supplier_id=supplier.id
                    )
                    self.db.add(purchasing)
                    self.db.flush()
                    purchasings_map[key] = purchasing
                else:
                    purchasing = purchasings_map[key]

                # --- product check ---
                product = self.db.query(Product).filter_by(name=product_name.upper()).first()
                if not product:
                    product = Product(
                        name=product_name.upper(),
                    )
                    self.db.add(product)
                    self.db.flush()

                # --- detail insert ---
                detail = PurchasingDetail(
                    quantity=row["qty"],
                    price=row["price"],
                    discount=row["discount"],
                    ppn=row["ppn"],
                    dpp=row["dpp"],
                    pph=row["pph"],
                    tax_no=row["tax_no"],
                    exchange_rate=row["exchange_rate"] or 1,
                    product_id=product.id,
                    purchasing_id=purchasing.id
                )
                self.db.add(detail)
                affected_product_ids.add(product.id)

            self.db.commit()

        # Bulk update the cost cache for all affected products
        if affected_product_ids:
            update_avg_cost_for_products(self.db.connection(), list(affected_product_ids))

        # refresh_product_avg_cost(self.db)

        def sanitize(obj):
            if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
                return None
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            if isinstance(obj, list):
                return [sanitize(v) for v in obj]
            return obj
        
        return APIResponse.created()

        # return sanitize({
        #     "inserted_detail_counts": count,
        # })
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        wb = load_workbook(BytesIO(contents), data_only=True, keep_links=False)

        HEADER_ROW = 6
        ROW_OFFSET = HEADER_ROW + 1

        valid_rows_data = []

        summary = {"sheets": {}, "missing_products": set(), "missing_suppliers": set(), "skipped": []}
        EXCLUDE_SHEETS = ["JANUARI 2025", "FEB 2025", "MARET", "APRIL", "MEI", "JUNI", "JULI"] # TODO: 2026 Change this shit
        for sheet in wb.sheetnames:
            if sheet in EXCLUDE_SHEETS:
                continue  

            df = pd.read_excel(BytesIO(contents), sheet_name=sheet, header=HEADER_ROW)
            df = df.iloc[:, :-2]

            rows_preview = []
            valid_rows = 0

            for idx, row in df.iterrows():
                excel_row_num = idx + ROW_OFFSET
                product_name_raw = row.get("NAMA BARANG")

                if pd.isna(product_name_raw):
                    continue

                product_name = safe_str(normalise_product_name(product_name_raw))
                if not product_name or product_name in {"NAT", "NONE"}:
                    continue

                kode_supplier = safe_str(row.get("KODE SUPPLIER"))
                tanggal = safe_date(row.get("TANGGAL"))
                no_bukti = safe_str(row.get("NO.BUKTI"))

                missing_cols = []
                if not kode_supplier:
                    missing_cols.append("KODE SUPPLIER")
                if not tanggal and not no_bukti:
                    missing_cols.append("TANGGAL/NO.BUKTI")

                if missing_cols:
                    summary["skipped"].append({
                        "sheet": sheet,
                        "row": excel_row_num,
                        "reason": f"missing column(s): {', '.join(missing_cols)}",
                        "product": product_name,
                    })
                    continue

                supplier = self.db.query(Supplier).filter_by(code=kode_supplier).first()
                if not supplier:
                    summary["missing_suppliers"].add(kode_supplier)
                    summary["skipped"].append({
                        "sheet": sheet,
                        "row": excel_row_num,
                        "reason": f"supplier not found: {kode_supplier}",
                        "product": product_name,
                    })
                    continue

                product = self.db.query(Product).filter_by(name=product_name.upper()).first()
                if not product:
                    summary["missing_products"].add(product_name)
                    summary["skipped"].append({
                        "sheet": sheet,
                        "row": excel_row_num,
                        "reason": f"product not found: {product_name}",
                    })
                    continue

                valid_rows += 1
                res = {
                    "sheet": sheet,
                    "row": excel_row_num,
                    "supplier": kode_supplier,
                    "product": product_name,
                    "qty": safe_number(row.get("QTY")),
                    "price": safe_number(row.get("HARGA SAT")),
                    "total": round((row.get("QTY") or 0) * (row.get("HARGA SAT") or 0), 2),
                    "tanggal": tanggal.isoformat() if tanggal else None,
                    "no_bukti": no_bukti,
                    "purchase_order": safe_str(row.get("NO.PO")),
                    "discount": safe_number(row.get("POT.")) or 0.0,
                    "ppn": safe_number((row.get("PPN") or 0) / (row.get("QTY") or 1)) or 0.0,
                    "dpp": safe_number(row.get("DPP")) or 0.0,
                    "pph": safe_number((row.get("PPH")) or 0 / (row.get("QTY") or 1)) or 0.0,
                    "tax_no": safe_str(row.get("FAKTUR PAJAK")),
                    "exchange_rate": safe_number(row.get("KURS")) or 1,
                }

                rows_preview.append(res)

                valid_rows_data.append(res)

            summary["sheets"][sheet] = {
                "valid_rows": valid_rows,
                "preview_rows": rows_preview[:30],  # limit to first 30 rows per sheet
            }

        preview_id = self.create_preview({
            "rows": valid_rows_data
        })

        return APIResponse.ok(
            data={
                "preview_id": preview_id,
                "summary": {
                    "total_sheets": len(summary["sheets"]),
                    "missing_products": sorted(list(summary["missing_products"])),
                    "missing_suppliers": sorted(list(summary["missing_suppliers"])),
                    "skipped_total": len(summary["skipped"]),
                },
                "sheets": summary["sheets"],
                "skipped_sample": summary["skipped"][:50],
            }
        )