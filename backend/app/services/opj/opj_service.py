from fastapi import Depends
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from fastapi import HTTPException

from app.core.database import get_db
from app.models import Opj, OpjDetail, OpjProcess, Client, Design
from app.schemas.input_models.opj_input_models import OpjCreate, OpjUpdate, OpjResponse
from app.utils.response import APIResponse
from app.utils.datatable.request import ListRequest


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
                opj.processes.append(OpjProcess(**p.model_dump()))

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
                opj.processes.append(OpjProcess(**p))

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
