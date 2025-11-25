# app/dependencies/auth.py
from typing import List, Optional
from fastapi import Depends, HTTPException, Request, status
from app.services.auth.auth_service import AuthService
from app.models.user import User

class AuthDependency:
    """Dependency untuk handle authentication & authorization"""
    
    @staticmethod
    def get_current_user(
        request: Request,
        auth_service: AuthService = Depends()
    ) -> User:
        """Dependency untuk mendapatkan current user dari token"""
        return auth_service.get_current_user(request)
    
    @staticmethod
    def require_roles(required_roles: List[str]):
        """
        Dependency untuk cek role user
        Usage: Depends(AuthDependency.require_roles(["admin", "manager"]))
        """
        def check_roles(
            current_user: User = Depends(AuthDependency.get_current_user),
            auth_service: AuthService = Depends()
        ) -> User:
            user_roles = auth_service.get_user_roles(current_user.id)
            
            if not any(role in user_roles for role in required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of roles: {', '.join(required_roles)}"
                )
            return current_user
        
        return check_roles
    
    @staticmethod
    def require_permissions(required_permissions: List[str]):
        """
        Dependency untuk cek permission user
        Usage: Depends(AuthDependency.require_permissions(["client.read", "client.write"]))
        """
        def check_permissions(
            current_user: User = Depends(AuthDependency.get_current_user),
            auth_service: AuthService = Depends()
        ) -> User:
            user_permissions = auth_service.get_user_permissions(current_user.id)
            
            if not any(perm in user_permissions for perm in required_permissions):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires one of permissions: {', '.join(required_permissions)}"
                )
            return current_user
        
        return check_permissions
    
    @staticmethod
    def optional_user(
        request: Request,
        auth_service: AuthService = Depends()
    ) -> Optional[User]:
        """Dependency untuk route yang optional auth"""
        try:
            return auth_service.get_current_user(request)
        except HTTPException:
            return None