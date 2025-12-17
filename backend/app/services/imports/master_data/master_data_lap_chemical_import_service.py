from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
from io import BytesIO
import pandas as pd

from app.models import (
    Product,
    Account, 
)

from app.utils.normalise import normalise_product_name
from app.utils.response import APIResponse

class MasterDataLapChemicalImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def _run(self, preview_id: str):
        payload = self.consume_preview(preview_id)
        rows = payload["rows"]

        updated, inserted, skipped = 0, 0, []
        seen_codes = set()  # prevent duplicates within this run

        for row in rows:
            code = row["code"]
            name = row["name"]
            unit = row["unit"]


            product = (
                self.db.query(Product)
                .filter((Product.code == code) | (Product.name == name))
                .first()
            )

            if product:
                if not product.code:
                    product.code = code
                updated += 1
            else:
                self.db.add(Product(
                    code=code,
                    name=name,
                    unit=unit,
                ))
                inserted += 1

        self.db.commit()

        return {
            "updated": updated,
            "inserted": inserted,
            "skipped_count": len(skipped),
            "skipped_samples": skipped[:10],
            # "account_id_used": account.id,
        }
    
    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        xls = pd.ExcelFile(BytesIO(contents))
        df = pd.read_excel(xls, sheet_name="CHEMICAL", header=4)

        rows_flat = []

        # account = self.db.query(Account).filter(Account.name == "PERSEDIAAN_OBAT").first()
        # if not account:
        #     raise ValueError("Account 'PERSEDIAAN_OBAT' not found in accounts table.")

        seen_codes = set()
        to_insert, to_update, skipped = [], [], []

        for _, row in df.iterrows():
            raw_name = row.get("NAMABRG")
            code = row.get("KDBRG")
            unit = row.get("SAT")

            if pd.isna(raw_name) or pd.isna(code):
                continue

            name = normalise_product_name(raw_name)
            code = str(code).strip().upper()

            if code in seen_codes:
                skipped.append(code)
                continue
            seen_codes.add(code)

            product = (
                self.db.query(Product)
                .filter((Product.code == code) | (Product.name == name))
                .first()
            )

            if product:
                action = "update" if (not product.code or not product.account_id) else "skip"
                if action == "update":
                    to_update.append({
                        "code": code,
                        "name": name,
                        "unit": unit,
                        # "current_account": product.account_id,
                        # "will_set_account": account.id,
                    })
                else:
                    skipped.append(code)
            else:
                to_insert.append({
                    "code": code,
                    "name": name,
                    "unit": unit,
                    # "account_id": account.id,
                })

            rows_flat.append({
                "code": code,
                "name": name,
                "unit": unit,
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
                    "to_update": len(to_update),
                    "skipped": len(skipped),
                    # "account_id_used": account.id,
                },
                "insert_samples": to_insert[:30],
                "update_samples": to_update[:30],
                "skipped_samples": skipped[:20],
            }
        )