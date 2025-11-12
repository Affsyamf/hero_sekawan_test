from sqlalchemy import event
from sqlalchemy.orm import Session
# from app.middleware.audit_middleware import current_user_id

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
