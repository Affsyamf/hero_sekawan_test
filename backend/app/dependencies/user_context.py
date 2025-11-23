from fastapi import Depends
from app.context.user_context import current_user_id
from app.dependencies.auth_dependency import AuthDependency
from app.models.user import User

def set_user_context_with_permissions(permissions: list[str]):
    async def dependency(
        user: User = Depends(AuthDependency.require_permissions(permissions))
    ):
        current_user_id.set(user.id)
        return user

    return dependency

def require_permissions(permissions: list[str]):
    return Depends(set_user_context_with_permissions(permissions))
