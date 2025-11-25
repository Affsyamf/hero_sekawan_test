from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload
from passlib.context import CryptContext

from app.schemas.input_models.user_input_models import UserCreate, UserUpdate, UserChangePassword
from app.core.database import Session, get_db
from app.models.user import User, Role, user_role
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService():
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def list_user(self, request: ListRequest):
        users = self.db.query(
            User,
            func.count(user_role.c.role_id).label('role_count')
        ).outerjoin(user_role, User.id == user_role.c.user_id)\
         .group_by(User.id)

        if request.q:
            like = f"%{request.q}%"
            users = users.filter(
                or_(
                    User.username.ilike(like),
                    User.email.ilike(like),
                    User.full_name.ilike(like),
                    User.phone_number.ilike(like)
                )
            )
            
        if request.start_date and request.end_date:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            users = users.filter(
                and_(
                    func.date(User.created_at) >= start,
                    func.date(User.created_at) <= end
                )
            )
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(User, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            users = users.order_by(sort_col)
        
        users = users.order_by(User.id.desc())

        return APIResponse.paginated(users, request, lambda row: {
            "id": row.User.id,
            "username": row.User.username,
            "email": row.User.email,
            "full_name": row.User.full_name,
            "phone_number": row.User.phone_number,
            "avatar_url": row.User.avatar_url,
            "is_active": row.User.is_active,
            "is_verified": row.User.is_verified,
            "role_count": row.role_count or 0,
            "last_login_at": row.User.last_login_at.isoformat() if row.User.last_login_at else None,
            "created_at": row.User.created_at.isoformat() if row.User.created_at else None,
            "updated_at": row.User.updated_at.isoformat() if row.User.updated_at else None,
        })

    def get_user(self, user_id: int):
        user = self.db.query(User).options(
            joinedload(User.roles).joinedload(Role.permissions)
        ).filter(User.id == user_id).first()

        if not user:
            return APIResponse.not_found(message=f"User ID '{user_id}' not found.")

        roles = []
        for role in user.roles:
            permissions = []
            for permission in role.permissions:
                permissions.append({
                    "id": permission.id,
                    "name": permission.name,
                    "description": permission.description,
                })
            
            roles.append({
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": permissions,
            })

        response = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "roles": roles,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }

        return APIResponse.ok(data=response)

    def create_user(self, request: UserCreate):
        try:
            # Check if username already exists
            existing_username = self.db.query(User).filter(User.username == request.username).first()
            if existing_username:
                return APIResponse.bad_request(message=f"Username '{request.username}' already exists.")

            # Check if email already exists
            existing_email = self.db.query(User).filter(User.email == request.email).first()
            if existing_email:
                return APIResponse.bad_request(message=f"Email '{request.email}' already exists.")

            user = User(
                username=request.username,
                email=request.email,
                password_hash=self.hash_password(request.password),
                full_name=request.full_name,
                phone_number=request.phone_number,
                avatar_url=request.avatar_url,
                is_active=request.is_active,
                is_verified=request.is_verified
            )
            self.db.add(user)
            self.db.flush()

            # Add roles
            if request.role_ids:
                for role_id in request.role_ids:
                    role = self.db.query(Role).filter(Role.id == role_id).first()
                    if role:
                        user.roles.append(role)

            self.db.commit()
            self.db.refresh(user)

            return APIResponse.created(message=f"User '{user.username}' created successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    def update_user(self, user_id: int, request: UserUpdate):
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse.not_found(message=f"User ID '{user_id}' not found.")

            # Check if new username already exists (exclude current user)
            if request.username is not None and request.username != user.username:
                existing_username = self.db.query(User).filter(
                    User.username == request.username,
                    User.id != user_id
                ).first()
                if existing_username:
                    return APIResponse.bad_request(message=f"Username '{request.username}' already exists.")

            # Check if new email already exists (exclude current user)
            if request.email is not None and request.email != user.email:
                existing_email = self.db.query(User).filter(
                    User.email == request.email,
                    User.id != user_id
                ).first()
                if existing_email:
                    return APIResponse.bad_request(message=f"Email '{request.email}' already exists.")

            # Update basic fields
            if request.username is not None:
                user.username = request.username
            if request.email is not None:
                user.email = request.email
            if request.password is not None:
                user.password_hash = self.hash_password(request.password)
            if request.full_name is not None:
                user.full_name = request.full_name
            if request.phone_number is not None:
                user.phone_number = request.phone_number
            if request.avatar_url is not None:
                user.avatar_url = request.avatar_url
            if request.is_active is not None:
                user.is_active = request.is_active
            if request.is_verified is not None:
                user.is_verified = request.is_verified

            # Update roles (replace all)
            if request.role_ids is not None:
                # Clear existing roles
                user.roles.clear()
                
                # Add new roles
                for role_id in request.role_ids:
                    role = self.db.query(Role).filter(Role.id == role_id).first()
                    if role:
                        user.roles.append(role)

            self.db.commit()
            
            return APIResponse.ok(message=f"User ID '{user_id}' updated successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

    def change_password(self, user_id: int, request: UserChangePassword):
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse.not_found(message=f"User ID '{user_id}' not found.")

            # Verify old password
            if not self.verify_password(request.old_password, user.password_hash):
                return APIResponse.bad_request(message="Old password is incorrect.")

            # Update to new password
            user.password_hash = self.hash_password(request.new_password)
            self.db.commit()

            return APIResponse.ok(message="Password changed successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

    def delete_user(self, user_id: int):
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                return APIResponse.not_found(message=f"User ID '{user_id}' not found.")
            
            self.db.delete(user)
            self.db.commit()

            return APIResponse.ok(message=f"User ID '{user_id}' deleted successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")