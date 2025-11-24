import os
from datetime import datetime, timedelta

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Request, HTTPException, status
from passlib.context import CryptContext

from app.core.database import get_db
from app.models.user import Permission, RefreshTokens, User
from app.utils.response import APIResponse

from fastapi import Response
from fastapi.responses import JSONResponse

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_SECONDS", 60))
REFRESH_TOKEN_EXPIRE_DAYS= 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db=Depends(get_db)):
        self.db = db
        
    def create_access_token(self, data: dict, expires_delta: timedelta | None = None):
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
    def create_refresh_token(self, user_id: int, request: Request) -> str:
        """Buat Refresh Token dan simpan ke database dengan metadata"""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Buat JWT refresh token
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        # Ambil user agent dan IP dari request
        user_agent = request.headers.get("User-Agent")
        ip_address = request.client.host
        
        # Simpan ke database
        refresh_token = RefreshTokens(
            user_id=user_id,
            token=token,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expire,
            revoked_at=None
        )
        self.db.add(refresh_token)
        self.db.commit()
        
        return token
    
    def login(self, username, password, request: Request, response: Response):
        """Login dengan Access Token + HttpOnlyRefresh Token"""
        user = self.db.query(User).filter(User.username == username).first()
        
        if not user:
            raise ValueError("Username/email salah")
        
        if not pwd_context.verify(password, user.password_hash):
            raise ValueError("Password salah")

        if not user.is_active:
            raise ValueError("Akun nonaktif")

        # Buat access token (15 menit)
        access_token = self.create_access_token({"sub": str(user.id), "name": user.full_name})
        
        # Buat refresh token (7 hari) dengan metadata
        refresh_token = self.create_refresh_token(user.id, request)

        roles = self.get_user_roles(user.id)
        permissions = self.get_user_permissions(user.id)

        res = JSONResponse({
            "message": "Login success",
            "access_token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "roles": roles,
                "permissions": permissions
            }
        })

        # HttpOnly cookie for refresh token
        res.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,         # set to True for prod with HTTPS -> dev = False, PROD = True
            samesite="Lax",      # required for localhost React + FastAPI -> dev = None, PROD = None
            max_age=7 * 24 * 3600,
            path="/"
        )

        return res
    
    def refresh_access_token(self, refresh_token: str):
        """Generate access token baru"""
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type"
                )
            
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )
            
            # Cek di database
            db_token = self.db.query(RefreshTokens).filter(
                RefreshTokens.token == refresh_token,
                RefreshTokens.user_id == int(user_id),
                RefreshTokens.revoked_at.is_(None),  # ✅ Sesuai dengan field revoked_at
                RefreshTokens.expires_at > datetime.utcnow()
            ).first()
            
            if not db_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token invalid or expired"
                )
            
            # Cek user
            user = self.db.query(User).filter(User.id == int(user_id)).first()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User not active"
                )
            
            # Buat access token baru
            new_access_token = self.create_access_token({
                "sub": str(user.id),
                "name": user.full_name
            })
            
            return APIResponse.ok(
                message="Token refreshed successfully",
                data={
                    "access_token": new_access_token,
                    "token_type": "bearer",
                    "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS
                }
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

    def logout(self, user_id: int, refresh_token: str = None):
        """Logout dengan revoke refresh token"""
        try:
            if refresh_token:
                # Revoke refresh token tertentu
                db_token = self.db.query(RefreshTokens).filter(
                    RefreshTokens.token == refresh_token,
                    RefreshTokens.user_id == user_id
                ).first()
                
                if db_token:
                    db_token.revoked_at = datetime.utcnow()  # ✅ Set revoked_at
                    self.db.commit()
            else:
                # Revoke semua refresh token user
                self.db.query(RefreshTokens).filter(
                    RefreshTokens.user_id == user_id,
                    RefreshTokens.revoked_at.is_(None)
                ).update({"revoked_at": datetime.utcnow()})
                self.db.commit()
            
            return APIResponse.ok(message="Logout success")
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Logout failed: {str(e)}"
            )

    def get_current_user(self, request: Request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Authorization header"
            )

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload"
                )

            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )

            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User nonaktif"
                )

            return user

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def get_user_roles(self, user_id: int):
        """Ambil semua role dari user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        return [r.name for r in user.roles] if user else []

    def get_user_permissions(self, user_id: int):
        """Ambil semua permission dari user (melalui role)"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        
        user_roles = [r.name for r in user.roles]
        if "Superadmin" in user_roles:
            # Return semua permission yang ada di database
            all_permissions = self.db.query(Permission).all()
            return [p.name for p in all_permissions]
    
        permissions = set()
        for role in user.roles:
            for perm in role.permissions:
                permissions.add(perm.name)
        return list(permissions)

    def has_role(self, user_id: int, role_name: str) -> bool:
        """Cek apakah user punya role tertentu"""
        roles = self.get_user_roles(user_id)
        return role_name in roles

    def has_permission(self, user_id: int, permission_name: str) -> bool:
        """Cek apakah user punya permission tertentu"""
        permissions = self.get_user_permissions(user_id)
        return permission_name in permissions
