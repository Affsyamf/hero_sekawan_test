from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime

from app.core.database import SessionLocal
from app.models.color_kitchen import ColorKitchenEntry
from app.models import Opj, OpjProcess, OpjDetail
from app.models.enum.opj_enum import PrintingInkEnum, PrintingMachineEnum, OpjProcessEnum

DEFAULT_OPJ_PROCESSES = [
    OpjProcessEnum.GREY,
    OpjProcessEnum.DYEING,
    OpjProcessEnum.PRINTING,
]

def make_opj_code(ck_code: str) -> str:
    """
    Convert '123 - 123' → 'OPJ123-123'
    """
    if not ck_code:
        return None

    # remove spaces
    cleaned = ck_code.replace(" ", "")

    # ensure consistent format
    return f"OPJ{cleaned}"

def repair_color_kitchen_missing_opj():
    db = SessionLocal()

    try:
        missing = db.execute(
            select(ColorKitchenEntry).where(ColorKitchenEntry.opj_id == None)
        ).scalars().all()

        print(f"[Startup] Found {len(missing)} entries missing OPJ → repairing...")

        for entry in missing:

            # Reuse OPJ if exists
            opj = db.execute(
                select(Opj).where(Opj.code == make_opj_code(entry.code))
            ).scalars().first()

            if not opj:
                opj = Opj(
                    code=make_opj_code(entry.code),
                    date=entry.date or datetime.utcnow(),
                    printing_ink=PrintingInkEnum.DISPERSE,
                    printing_machine=PrintingMachineEnum.ROTARY,
                    client_id=None,
                    design_id=entry.design_id,
                )
                db.add(opj)
                db.flush()

                # ADD DEFAULT OPJ PROCESS ROWS (FIXED)
                for p in DEFAULT_OPJ_PROCESSES:
                    opj.processes.append(OpjProcess(process_type=p))

                # ADD OPJ DETAIL
                opj.details.append(
                    OpjDetail(
                        roll=entry.rolls,
                        ground_color="UNKNOWN",
                        quantity=None
                    )
                )

            # Link CK entry → OPJ
            entry.opj_id = opj.id

        db.commit()

    except Exception as e:
        db.rollback()
        print("Startup error:", e)

    finally:
        db.close()
