from datetime import datetime
from contextvars import ContextVar
from contextlib import contextmanager
from sqlalchemy import event
from sqlalchemy.orm import Session
# from app.middleware.audit_middleware import current_user_id

_force_hard_delete = ContextVar("_force_hard_delete", default=False)

@contextmanager
def allow_hard_delete():
    token = _force_hard_delete.set(True)
    try:
        yield
    finally:
        _force_hard_delete.reset(token)

@event.listens_for(Session, "before_flush")
def apply_audit_fields(session, flush_context, instances):
    # user_id = current_user_id.get()  # TODO:should come from middleware
    user_id = 1

    if not user_id:
        return  # skip for anonymous/background jobs

    for obj in session.new:
        if hasattr(obj, "created_by") and getattr(obj, "created_by") is None:
            obj.created_by = user_id
        if hasattr(obj, "updated_by"):
            obj.updated_by = user_id

    for obj in session.dirty:
        if hasattr(obj, "updated_by"):
            obj.updated_by = user_id

    for obj in list(session.deleted):
        if not hasattr(obj, "deleted_at"):
            continue

        # Allow hard delete if context flag is set
        if _force_hard_delete.get():
            continue

        # Soft delete
        obj.deleted_at = datetime.utcnow()
        if hasattr(obj, "deleted_by"):
            obj.deleted_by = user_id

        # Cancel actual DELETE and re-add to session as update
        session.add(obj)
        session.deleted.discard(obj)

