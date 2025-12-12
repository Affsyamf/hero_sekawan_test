from fastapi import Depends
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from fastapi import HTTPException

from app.core.database import get_db
from app.utils.response import APIResponse
from app.utils.datatable.request import ListRequest

from app.models import Opj, OpjDetail, OpjProcessCondition, Client, Design, ColorKitchenEntry
from app.models.enum.opj_enum import OpjProcessEnum, PrintingMachineEnum, ProcessConditionEnum
from app.schemas.input_models.opj_input_models import OpjCreate, OpjUpdate, OpjResponse

DEFAULT_OPJ_PROCESSES = [
    ProcessConditionEnum.GREY,
    ProcessConditionEnum.DYEING,
    ProcessConditionEnum.PRINTING,
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


class OpjService:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    # CREATE
    def create_opj(self, request: OpjCreate):
        # cek client dan design, lalu barengan dengan detail dsan proses
        try:
            existing = self.db.query(Opj).filter(Opj.code == request.code).first()
            if existing:
                return APIResponse.conflict(message=f"OPJ code '{request.code}' already exists.")
            
            client = (
                self.db.query(Client)
                .filter(Client.id == request.client_id, Client.deleted_at.is_(None))
                .first()
            )
            if not client:
                return APIResponse.bad_request(message="Client tidak valid atau sudah terhapus.")
            
            design = (
                self.db.query(Design)
                .filter(Design.id == request.design_id, Design.deleted_at.is_(None))
                .first()
            )
            if not design:
                return APIResponse.bad_request(message="Design tidak valid atau sudah terhapus.")

            opj = Opj(**request.model_dump(exclude={"details", "processes"}))

            # Add Details
            for d in request.details:
                opj.details.append(OpjDetail(**d.model_dump()))

            # Add Processes
            for p in request.processes:
                opj.processes.append(OpjProcessCondition(**p.model_dump()))

            self.db.add(opj)
            self.db.commit()
            self.db.refresh(opj)

            return APIResponse.created(data={"id": opj.id, "code": opj.code})

        except Exception as e:
            self.db.rollback()
            return APIResponse.error(message=str(e))

    # LIST
    def list_opj(self, request: ListRequest):
        query = self.db.query(Opj)

        if request.q:
            like = f"%{request.q}%"
            query = query.filter(
                or_(
                    Opj.code.ilike(like),
                    Opj.term.ilike(like)
                )
            )

        return APIResponse.paginated(
            query, request, lambda opj: {
                "id": opj.id,
                "code": opj.code,
                "date": opj.date.isoformat(),
                "client_id": opj.client_id,
                "design_id": opj.design_id,
            }
        )

    # GET BY ID
    def get_opj(self, opj_id: int):
        opj = (
            self.db.query(Opj)
            .options(
                joinedload(Opj.details),
                joinedload(Opj.processes)
            )
            .filter(Opj.id == opj_id)
            .first()
        )

        if not opj:
            raise HTTPException(404, f"OPJ ID '{opj_id}' not found")

        return OpjResponse.from_orm(opj)
    

    # UPDATE
    def update_opj(self, opj_id: int, request: OpjUpdate):
        opj = self.db.query(Opj).filter(Opj.id == opj_id).first()
        if not opj:
            return APIResponse.not_found(message=f"OPJ ID '{opj_id}' not found")

        data = request.model_dump(exclude_unset=True)

        # Handle basic fields
        basic_fields = {k: v for k, v in data.items() if k not in ["details", "processes"]}

        for key, value in basic_fields.items():
            setattr(opj, key, value)

        # Replace details if provided
        if "details" in data:
            opj.details.clear()
            for d in data["details"]:
                opj.details.append(OpjDetail(**d))

        # Replace processes if provided
        if "processes" in data:
            opj.processes.clear()
            for p in data["processes"]:
                opj.processes.append(OpjProcessCondition(**p))

        self.db.commit()
        self.db.refresh(opj)

        return APIResponse.ok(message=f"OPJ ID '{opj_id}' updated.")


    # DELETE
    def delete_opj(self, opj_id: int):
        opj = self.db.query(Opj).filter(Opj.id == opj_id).first()
        if not opj:
            return APIResponse.not_found(message=f"OPJ ID '{opj_id}' not found")

        self.db.delete(opj)
        self.db.commit()

        return APIResponse.ok(message=f"OPJ ID '{opj_id}' deleted.")
    
    def ensure_opj_for_entry(self, entry: ColorKitchenEntry):
        """
        Creates or reuses OPJ for the given ColorKitchenEntry.
        Returns the OPJ instance.
        """

        opj_code = make_opj_code(entry.code)

        # 1) Find existing OPJ
        opj = self.db.query(Opj).filter(Opj.code == opj_code).first()

        # 2) Create if missing
        if not opj:
            opj = Opj(
                code=opj_code,
                date=entry.date,
                process_type=OpjProcessEnum.DISPERSE,
                printing_machine=PrintingMachineEnum.ROTARY,
                client_id=None,
                design_id=entry.design_id,
            )
            self.db.add(opj)
            self.db.flush()  # get opj.id

            # Default process conditions
            for p in DEFAULT_OPJ_PROCESSES:
                self.db.add(OpjProcessCondition(opj_id=opj.id, process_type=p))

            # Default detail
            self.db.add(
                OpjDetail(
                    opj_id=opj.id,
                    roll=entry.rolls,
                    ground_color="UNKNOWN",
                    quantity=None
                )
            )

        return opj
