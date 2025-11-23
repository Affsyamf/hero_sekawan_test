from app.rbac.roles import ROLE_USER, ROLE_ADMIN
from fastapi import Depends
from app.dependencies.user_context import set_user_context_with_permissions

def require_user():
    return Depends(set_user_context_with_permissions(ROLE_USER))

def require_admin():
    return Depends(set_user_context_with_permissions(ROLE_ADMIN))