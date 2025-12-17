from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime
from io import BytesIO
import pandas as pd
from datetime import datetime, timedelta


from app.models import (
    Product,
    StockOpname, 
    StockOpnameDetail,
    Ledger
)

from app.models.ledger import LedgerLocation, LedgerRef

from app.utils.normalise import normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.response import APIResponse

class StockOpnameChemicalImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)


    def end_of_last_month(base_date: datetime | None = None) -> datetime:
        if base_date is None:
            base_date = datetime.utcnow()

        first_of_this_month = base_date.replace(day=1)
        return first_of_this_month - timedelta(days=1)

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]

        start_date = self.end_of_last_month()
        opn_code = "OPN-" + start_date.strftime("%Y%m%d")

        stock_opname = StockOpname(
            date=start_date,
            code=opn_code,
        )
        self.db.add(stock_opname)
        self.db.flush()

        skipped = 0
        skipped_products = []
        added = 0

        for row in rows:
            prod_name = row["product"]
            system_qty = row["system_qty"]
            physical_qty = row["physical_qty"]

            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                skipped += 1
                skipped_products.append(prod_name)
                continue

            detail = StockOpnameDetail(
                product=product,
                system_quantity=system_qty,
                physical_quantity=physical_qty,
                stock_opname=stock_opname
            )
            self.db.add(detail)

            # --- Ledger ---
            difference = system_qty - physical_qty
            if difference != 0:
                if difference > 0:
                    ledger_entry = Ledger(
                        date=start_date,
                        ref=LedgerRef.StockOpname.value,
                        ref_code=opn_code,
                        location=LedgerLocation.Gudang.value,
                        quantity_in=0.0,
                        quantity_out=difference,
                        product=product,
                    )
                    self.db.add(ledger_entry)
                else:
                    ledger_entry_kitchen = Ledger(
                        date=start_date,
                        ref=LedgerRef.StockOpname.value,
                        ref_code=opn_code,
                        location=LedgerLocation.Kitchen.value,
                        quantity_in=0.0,
                        quantity_out=abs(difference),
                        product=product,
                    )
                    ledger_entry_gudang = Ledger(
                        date=start_date,
                        ref=LedgerRef.StockOpname.value,
                        ref_code=opn_code,
                        location=LedgerLocation.Gudang.value,
                        quantity_in=abs(difference),
                        quantity_out=0.0,
                        product=product,
                    )
                    self.db.add(ledger_entry_kitchen)
                    self.db.add(ledger_entry_gudang)

            added += 1

        self.db.commit()

        return APIResponse.created(
            data={
                "added": added,
                "skipped": skipped,
                "skipped_products": skipped_products,
            }
        )
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        xls = pd.ExcelFile(BytesIO(contents))
        start_date = datetime(2025, 7, 31)

        preview_rows_flat = []

        df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
        df = df[df["NO"].notna()]

        preview_rows = []
        skipped_products = []
        added = 0

        for _, row in df.iterrows():
            prod_name = safe_str(normalise_product_name(row.get("NAMA BARANG")))
            if not prod_name:
                continue

            system_qty = safe_number(row.get("SALDO AWAL")) + safe_number(row.get("MUTASI MASUK")) - safe_number(row.get("MUTASI KELUAR"))
            physical_qty = safe_number(row.get("FISIK"))
            difference = (system_qty or 0) - (physical_qty or 0)

            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                skipped_products.append({"name": prod_name, "reason": "Product not found"})
                continue

            added += 1

            # Decide movement summary for preview
            if difference == 0:
                movement_desc = "MATCH"
            elif difference > 0:
                movement_desc = f"OUT {abs(difference)} from Gudang"
            else:
                movement_desc = f"IN {abs(difference)} to Gudang (OUT from Kitchen)"

            res = {
                "product": prod_name,
                "system_qty": system_qty,
                "physical_qty": physical_qty,
                "difference": difference,
                "movement": movement_desc
            }

            preview_rows.append(res)

            preview_rows_flat.append(res)

        preview_id = self.create_preview({
            "rows": preview_rows_flat
        })

        return APIResponse.ok(
            data={
                "preview_id": preview_id,
                "summary": {
                    "total_rows": len(df),
                    "valid_products": added,
                    "skipped_products": len(skipped_products),
                },
                "preview_rows": preview_rows,
                "skipped_sample": skipped_products,
            }
        )