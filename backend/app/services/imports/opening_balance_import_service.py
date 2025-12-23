from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from datetime import datetime
from io import BytesIO
import pandas as pd
import math, re
from collections import defaultdict
from fastapi import HTTPException
from openpyxl import load_workbook

from app.models import (
    Product,
    Supplier, 
    Purchasing,
    PurchasingDetail,
    StockMovement,
    StockMovementDetail,
    Account
)

from app.utils.normalise import normalise_product_name
from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.cost_helper import update_avg_cost_for_products, refresh_product_avg_cost
from app.utils.response import APIResponse
from app.utils.event_flags import skip_cost_cache_updates

class OpeningBalanceImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def get_or_create_system_supplier(self):
        supplier = self.db.query(Supplier).filter_by(code="SYSTEM").first()
        if not supplier:
            supplier = Supplier(code="SYSTEM", name="System Opening Balance")
            self.db.add(supplier)
            self.db.commit()
        return supplier

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]
        add_products = payload["add_products"]
        prod_added = 0

        with skip_cost_cache_updates():
            for prod in add_products:
                account_id = None

                if prod.get("account"):
                    account = (
                        self.db.query(Account)
                        .filter_by(name=prod["account"])
                        .first()
                    )
                    if account:
                        account_id = account.id

                product_found = self.db.query(Product).filter_by(name=prod["name"].upper()).first()
                if not product_found:
                    product = Product(
                        name=prod["name"].upper(),
                        unit=prod["unit"],
                        account_id=account_id
                    )
                    self.db.add(product)
                    prod_added += 1
                    self.db.flush()

            system_supplier = self.get_or_create_system_supplier()

            start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            purchasing = Purchasing(
                date=start_date,
                code="OPENBAL-" + start_date.strftime("%Y%m%d"),
                purchase_order="OPENBAL",
                supplier=system_supplier
            )
            self.db.add(purchasing)
            self.db.flush()

            skipped = 0
            skipped_products = []
            added = 0
            affected_products = set()

            for row in rows:
                prod_name = row["product"]

                product = self.db.query(Product).filter_by(name=prod_name).first()
                if not product:
                    skipped += 1
                    skipped_products.append({
                        "name": prod_name,
                        "reason": "Product not found"
                    })
                    continue

                init_qty = row["quantity"]
                unit_price = row["unit_price"]

                if not init_qty or init_qty == 0:
                    skipped += 1
                    skipped_products.append({
                        "name": prod_name,
                        "reason": "Saldo awal kosong"
                    })
                    continue

                dpp = unit_price * init_qty
                ppn = unit_price * 0.11

                detail = PurchasingDetail(
                    product=product,
                    purchasing=purchasing,
                    quantity=init_qty,
                    price=unit_price,
                    discount=0.0,
                    ppn=ppn,
                    pph=0.0,
                    dpp=dpp,
                    tax_no=None,
                    exchange_rate=0.0,
                )
                self.db.add(detail)

                affected_products.add(product.id)
                added += 1

            self.db.commit()

            if affected_products:
                update_avg_cost_for_products(self.db.connection(), list(affected_products))

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

        df = pd.read_excel(xls, sheet_name="GUDANG BESAR", header=4)
        df = df[df["NO"].notna()]

        preview_rows = []
        skipped_products = []
        add_products = []
        added = 0

        preview_rows_flat = []

        for _, row in df.iterrows():
            prod_name = safe_str(normalise_product_name(row.get("NAMA BARANG")))
            acc_name = safe_str(row.get("KETERANGAN"))
            if not prod_name:
                continue

            
            product = self.db.query(Product).filter_by(name=prod_name).first()
            if not product:
                add_products.append({ "name": prod_name, "account": acc_name, "unit": safe_str(row.get("SATUAN")) })

            init_qty = safe_number(row.get("SALDO AWAL"))

            price = safe_number(row.get("JUMLAH SALDO AWAL + PPN"))
            if price is None or price == 0:
                tmp_price = safe_number(row.get("JUMLAH FISIK"))
                end_qty = safe_number(row.get("FISIK"))
                unit_price = tmp_price / end_qty if end_qty != 0 else 0
            else:
                price = price / init_qty
                unit_price = price / 1.11  # remove PPN

            if init_qty is None or init_qty == 0:
                skipped_products.append({ "name": prod_name, "reason": "Saldo awal kosong"})
                continue

            dpp = unit_price * init_qty
            ppn = unit_price * 0.11

            added += 1
            preview_rows.append({
                "product": prod_name,
                "quantity": init_qty,
                "unit_price": round(unit_price, 2),
                "dpp": round(dpp, 2),
                "ppn": round(ppn, 2),
                "total": round(dpp + ppn, 2),
            })

            preview_rows_flat.append({
                "product": prod_name,
                "quantity": init_qty,
                "unit_price": unit_price,
            })
            
        preview_id = self.create_preview({
            "rows": preview_rows_flat,
            "add_products": add_products
        })

        return APIResponse.ok(
            data={
                "preview_id": preview_id,
                "summary": {
                    "total_rows": len(df),
                    "valid_products": added,
                    "skipped_products": len(skipped_products),
                },
                "preview_rows": preview_rows[:50],  # show only first 50 for performance
                "skipped_sample": skipped_products[:50],
            }
        )