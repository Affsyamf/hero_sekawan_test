from fastapi import UploadFile
from app.utils.deps import DB 
from app.services.imports.base_import_service import BaseImportService
import pandas as pd
from io import BytesIO

from app.utils.safe_parse import safe_str, safe_date, safe_number
from app.utils.response import APIResponse

from app.models import Opj, OpjDetail, OpjProcessCondition, Delivery, Client, Sale, Design, DesignType, Return
from app.models.enum.opj_enum import OpjProcessEnum, PrintingMachineEnum, ProcessConditionEnum

DEFAULT_OPJ_PROCESSES = [
    ProcessConditionEnum.GREY,
    ProcessConditionEnum.DYEING,
    ProcessConditionEnum.PRINTING,
]

PROCESS_MAP = {
    "DISPERSE": OpjProcessEnum.DISPERSE,
    "REACTIVE": OpjProcessEnum.REACTIVE,
    "PIGMENT": OpjProcessEnum.PIGMENT,
    "CUCI+FINISH": OpjProcessEnum.CUCIFINISH,
    "PROSES": OpjProcessEnum.PROSES,

    "PBK": OpjProcessEnum.PERBAIKAN,
    "PERBAIKAN": OpjProcessEnum.PERBAIKAN,
}


class SalesImportService(BaseImportService):
    def __init__(self, db: DB):
        super().__init__(db)

    def read_sales_excel(self, contents):
        import pandas as pd
        from io import BytesIO

        HEADER_ROWS = 5
        SHEET = 0

        # 1️⃣ Read only the header rows (unrestricted)
        raw = pd.read_excel(
            BytesIO(contents),
            sheet_name=SHEET,
            header=None,
            nrows=HEADER_ROWS
        )

        header_cols = len(raw.columns)

        # 2️⃣ Read the data rows (unrestricted)
        df = pd.read_excel(
            BytesIO(contents),
            sheet_name=SHEET,
            header=HEADER_ROWS
        )

        data_cols = len(df.columns)

        # 3️⃣ Take the minimum count to avoid out-of-bounds
        num_cols = min(header_cols, data_cols)

        raw = raw.iloc[:, :num_cols]
        df = df.iloc[:, :num_cols]

        def scalar(v):
            return str(v).strip() if pd.notna(v) else ""

        columns = []
        for col_idx in range(num_cols):
            top = scalar(raw.iat[3, col_idx])   # row 4
            sub = scalar(raw.iat[4, col_idx])   # row 5

            final = f"{top}|{sub}" if sub else top
            columns.append(final)

        df.columns = columns
        first_col = columns[0]
        df = df[df[first_col].notna() & (df[first_col].astype(str).str.strip() != "")]      
        return df, columns
    
    def insert_sales_row(self, row):
        # 1️⃣ CLIENT — always create if missing
        client_name = row["client"]
        client = self.db.query(Client).filter(Client.name == client_name).first()
        if not client:
            client = Client(name=client_name)
            self.db.add(client)
            self.db.flush()

        design_type = self.db.query(DesignType).filter_by(name=row["design_type"]).first()
        if not design_type:
            design_type = DesignType(name=row["design_type"])
            self.db.add(design_type)
            self.db.flush()

        design = self.db.query(Design).filter_by(code=row["design"]).first()
        if not design:
            design = Design(code=row["design"], type_id=design_type.id)
            self.db.add(design)
            self.db.flush()

        sale_date = row["date"]

        # 2️⃣ OPJ — ensure exists (auto-create)
        opj_code = row["opj"]
        opj = self.db.query(Opj).filter_by(code=opj_code).first()
        if not opj:
            opj = Opj(
                code=opj_code,
                date=sale_date,
                process_type=row["process_type"],
                printing_machine=PrintingMachineEnum.ROTARY,
                client_id=client.id,
                design_id=design.id,
                unit_price=row["unit_price"]
            )
            self.db.add(opj)
            self.db.flush()

            self.db.add(
                OpjDetail(
                    opj_id=opj.id,
                    roll=row["roll"],
                    ground_color="UNKNOWN",
                    quantity=row["quantity_start"]
                )
            )

            for p in DEFAULT_OPJ_PROCESSES:
                self.db.add(OpjProcessCondition(opj_id=opj.id, process_type=p)) # TODO Perbaikan vs grey

        # 3️⃣ SALE
        sale = Sale(
            date=sale_date,
            code=row["invoice"],
            quantity_start=row["quantity_start"],
            quantity_end=row["quantity_end"],
            ppn=row["ppn"],
            discount=row["discount"],
            client_id=client.id,
            opj_id=opj.id,
        )
        self.db.add(sale)
        self.db.flush()

        # 4️⃣ DELIVERY
        delivery = Delivery(
            date=sale_date,
            code=row["delivery"]["sj"],
            quantity=row["quantity_end"],
            roll=row["roll"],
            sale_id=sale.id
        )
        self.db.add(delivery)

        return sale.id
    
    def insert_pbk_row(self, row):
        source_opj_code = row["source_opj"]
        date = safe_date(row["date"])

        # 1. Find OPJ being fixed
        source_opj = self.db.query(Opj).filter_by(code=source_opj_code).first()
        if not source_opj:
            raise ValueError(f"PBK: OPJ not found: {source_opj_code}")

        # 2. Resolve original Sale
        sale = (
            self.db.query(Sale)
            .filter(Sale.opj_id == source_opj.id)
            .order_by(Sale.date.asc())
            .first()
        )

        if not sale:
            raise ValueError(f"PBK: Sale not found for OPJ {source_opj_code}")
        
        # OPJ — ensure exists (auto-create)
        opj_code = row["opj"]
        opj = self.db.query(Opj).filter_by(code=opj_code).first()
        if not opj:
            opj = Opj(
                code=opj_code,
                date=date,
                process_type=row["process_type"],
                printing_machine=PrintingMachineEnum.ROTARY,
                client_id=source_opj.client.id,
                design_id=source_opj.design.id,
                unit_price=row["unit_price"]
            )
            self.db.add(opj)
            self.db.flush()

            self.db.add(
                OpjDetail(
                    opj_id=opj.id,
                    roll=row["roll"],
                    ground_color="UNKNOWN",
                    quantity=row["quantity_start"]
                )
            )
            
            self.db.add(OpjProcessCondition(opj_id=opj.id, process_type=ProcessConditionEnum.PERBAIKAN))

        # 3. Create Return
        ret = Return(
            date=date,
            code=row["invoice"],
            sale_id=sale.id,
            opj_id=opj.id,
            quantity_start=row["quantity_start"],
            quantity_end=row["quantity_end"],
        )
        self.db.add(ret)
        self.db.flush()

        # 4. Create Delivery (return delivery)
        delivery = Delivery(
            date=date,
            code=row["delivery"]["sj"],
            quantity=row["quantity_end"],
            roll=row["roll"],
            return_id=ret.id
        )
        self.db.add(delivery)

    def preview(self, file: UploadFile):
        contents: bytes = file.file.read()
        df, columns = self.read_sales_excel(contents)

        summary = {
            "preview_id": 0,
            "total_rows": len(df),
            "valid_rows": 0,
            "skipped": 0,
            "errors": [],
            "sales": []
        }

        sales_map = {}  # (invoice, date) → sale preview
        return_map = {}

        for idx, row in df.iterrows():
            excel_row = idx + 6  # header=5

            sj = safe_str(row.get("SURAT|JALAN"))
            invoice = safe_str(row.get("NO|INVOICE"))
            sale_date = safe_date(row.get("TGL|INVOICE"))
            client_name = safe_str(row.get("CUSTOMER"))
            opj_code = safe_str(row.get("OPJ"))
            design_code = safe_str(row.get("DESIGN"))
            design_type_name = safe_str(row.get("JENIS|KAIN"))
            process_raw = safe_str(row.get("JENIS|PROSES")).upper()

            is_sales = process_raw not in {"PBK", "PERBAIKAN"}

            if not sj or not invoice or not sale_date or not client_name:
                summary["skipped"] += 1
                continue

            # Duplicate check: existing SJ or INVOICE
            if self.db.query(Delivery).filter(Delivery.code == sj).first():
                summary["skipped"] += 1
                continue

            if self.db.query(Sale).filter(Sale.code == invoice).first():
                summary["skipped"] += 1
                continue

            if self.db.query(Return).filter(Return.code == invoice).first():
                summary["skipped"] += 1
                continue

            # Client check
            client = self.db.query(Client).filter(Client.name == client_name).first()
            if not client:
                summary["errors"].append({
                    "row": excel_row,
                    "reason": f"client will be created: {client_name}"
                })

            # OPJ check
            opj = self.db.query(Opj).filter_by(code=opj_code).first()
            if not opj:
                summary["errors"].append({
                    "row": excel_row,
                    "reason": f"OPJ will be auto-created: {opj_code}"
                })

            # Design check
            design = self.db.query(Design).filter_by(code=design_code).first()
            if not design and is_sales:
                summary["errors"].append({
                    "row": excel_row,
                    "reason": f"Design will be auto-created: {design_code}"
                })

            design_type = self.db.query(DesignType).filter_by(name=design_type_name).first()
            if not design_type:
                summary["errors"].append({
                    "row": excel_row,
                    "reason": f"Design will be auto-created: {design_type_name}"
                })

            process_enum = None
            if process_raw:
                if process_raw not in PROCESS_MAP:
                    summary["errors"].append({
                        "row": excel_row,
                        "reason": f"Invalid process type: {process_raw}"
                    })
                else:
                    process_enum = PROCESS_MAP[process_raw]

            key = (invoice, sale_date)
            if is_sales:
                if key not in sales_map:
                    sales_map[key] = {
                        "invoice": invoice,
                        "date": sale_date.isoformat(),
                        "client": client_name,
                        "opj": opj_code,
                        "process_type": process_enum.value if process_enum else None,
                        "quantity_start": safe_number(row.get("QTY|ASAL")) or 0,
                        "quantity_end": safe_number(row.get("QTY|JADI")) or 0,
                        "ppn": safe_number(row.get("PPN")) or 0,
                        "discount": safe_number(row.get("DISC")) or 0,
                        "design": design_code,
                        "design_type": design_type_name,
                        "roll": safe_number(row.get("ROLL")) or 0,
                        "unit_price": safe_number(row.get("HARGA")) or 0,
                        "delivery": {
                            "sj": sj,
                            "quantity": safe_number(row.get("QTY|JADI")) or 0,
                        }
                    }
            else:
                if key not in return_map:
                    return_map[key] = {
                        "invoice": invoice,
                        "date": sale_date.isoformat(),
                        "client": client_name,
                        "opj": opj_code,
                        "process_type": process_enum.value if process_enum else None,
                        "quantity_start": safe_number(row.get("QTY|ASAL")) or 0,
                        "quantity_end": safe_number(row.get("QTY|JADI")) or 0,
                        "ppn": safe_number(row.get("PPN")) or 0,
                        "discount": safe_number(row.get("DISC")) or 0,
                        "source_opj": design_code,
                        "roll": safe_number(row.get("ROLL")) or 0,
                        "unit_price": safe_number(row.get("HARGA")) or 0,
                        "delivery": {
                            "sj": sj,
                            "quantity": safe_number(row.get("QTY|JADI")) or 0,
                        }
                    }

            summary["valid_rows"] += 1

        summary["sales"] = list(sales_map.values())
        summary["total_sales"] = len(summary["sales"])

        summary["pbk"] = list(return_map.values())
        summary["total_pbk"] = len(summary["pbk"])

        preview_id = self.create_preview({
            "sales": list(sales_map.values()),
            "pbk": list(return_map.values())
        })

        summary["preview_id"] = preview_id

        return APIResponse.ok(data=summary)
    
    def _run(self, preview_id: int):
        payload = self.consume_preview(preview_id)
        sales = payload["sales"]
        pbk = payload["pbk"]

        inserted = {
            "sales": 0,
            "deliveries": 0,
            "skipped": 0,
            "errors": []
        }

        sales_map = {}      # (invoice, date) → Sale
        delivery_map = set()  # SJ codes to prevent duplicates

        for idx, row in enumerate(sales):
            try:
                sj = row["delivery"]["sj"]
                invoice = row["invoice"]
                sale_date = row["date"]

                if not sj or not invoice or not sale_date:
                    inserted["skipped"] += 1
                    continue

                sale_key = (invoice, sale_date)

                if sale_key not in sales_map:
                    sale_id = self.insert_sales_row(row)
                    sales_map[sale_key] = sale_id
                    inserted["sales"] += 1
                else:
                    sale_id = sales_map[sale_key]

                # prevent duplicate SJ
                if sj not in delivery_map:
                    delivery_map.add(sj)
                    inserted["deliveries"] += 1

            except Exception as e:
                inserted["errors"].append({
                    "invoice": invoice,
                    "reason": str(e)
                })

        self.db.flush()

        for idx, row in enumerate(pbk):
            try:
                sj = row["delivery"]["sj"]
                invoice = row["invoice"]
                sale_date = row["date"]

                if not sj or not invoice or not sale_date:
                    inserted["skipped"] += 1
                    continue

                sale_key = (invoice, sale_date)

                if sale_key not in sales_map:
                    sale_id = self.insert_pbk_row(row)
                    sales_map[sale_key] = sale_id
                    inserted["sales"] += 1
                else:
                    sale_id = sales_map[sale_key]

                # prevent duplicate SJ
                if sj not in delivery_map:
                    delivery_map.add(sj)
                    inserted["deliveries"] += 1

            except Exception as e:
                inserted["errors"].append({
                    "invoice": invoice,
                    "reason": str(e)
                })

        self.db.commit()
        return inserted