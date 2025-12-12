from app.services.opj.opj_service import OpjService
from app.core.database import SessionLocal
from app.models.color_kitchen import ColorKitchenEntry

def repair_color_kitchen_missing_opj():
    db = SessionLocal()

    try:
        service = OpjService(db)

        missing = (
            db.query(ColorKitchenEntry)
              .filter(ColorKitchenEntry.opj_id == None)
              .all()
        )

        print(f"[Startup] Found {len(missing)} entries missing OPJ → repairing...")
        
        for entry in missing:
            opj = service.ensure_opj_for_entry(entry)
            entry.opj_id = opj.id

        db.commit()

    except Exception as e:
        db.rollback()
        print("Startup error:", e)

    finally:
        db.close()
