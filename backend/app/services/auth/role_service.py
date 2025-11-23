from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.user_input_models import RoleCreate, RoleUpdate
from app.core.database import Session, get_db
from app.models.user import Role, Permission, role_permission
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse


class RoleService():
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_role(self, request: ListRequest):
        roles = self.db.query(
            Role,
            func.count(role_permission.c.permission_id).label('permission_count')
        ).outerjoin(role_permission, Role.id == role_permission.c.role_id)\
         .group_by(Role.id)

        if request.q:
            like = f"%{request.q}%"
            roles = roles.filter(
                or_(
                    Role.name.ilike(like),
                    Role.description.ilike(like)
                )
            )
            
        if request.start_date and request.end_date:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            roles = roles.filter(
                and_(
                    func.date(Role.created_at) >= start,
                    func.date(Role.created_at) <= end
                )
            )
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Role, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            roles = roles.order_by(sort_col)
        
        roles = roles.order_by(Role.id.desc())

        return APIResponse.paginated(roles, request, lambda row: {
            "id": row.Role.id,
            "name": row.Role.name,
            "description": row.Role.description,
            "permission_count": row.permission_count or 0,
            "created_at": row.Role.created_at.isoformat() if row.Role.created_at else None,
            "updated_at": row.Role.updated_at.isoformat() if row.Role.updated_at else None,
        })

    def get_role(self, role_id: int):
        role = self.db.query(Role).options(
            joinedload(Role.permissions)
        ).filter(Role.id == role_id).first()

        if not role:
            return APIResponse.not_found(message=f"Role ID '{role_id}' not found.")

        permissions = []
        for permission in role.permissions:
            permissions.append({
                "id": permission.id,
                "name": permission.name,
                "description": permission.description,
            })

        response = {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": permissions,
            "created_at": role.created_at.isoformat() if role.created_at else None,
            "updated_at": role.updated_at.isoformat() if role.updated_at else None,
        }

        return APIResponse.ok(data=response)

    def create_role(self, request: RoleCreate):
        try:
            # Check if role name already exists
            existing_role = self.db.query(Role).filter(Role.name == request.name).first()
            if existing_role:
                return APIResponse.bad_request(message=f"Role name '{request.name}' already exists.")

            role = Role(
                name=request.name,
                description=request.description
            )
            self.db.add(role)
            self.db.flush()

            # Add permissions
            if request.permission_ids:
                for permission_id in request.permission_ids:
                    permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
                    if permission:
                        role.permissions.append(permission)

            self.db.commit()
            self.db.refresh(role)

            return APIResponse.created(message=f"Role '{role.name}' created successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create role: {str(e)}")

    def update_role(self, role_id: int, request: RoleUpdate):
        try:
            role = self.db.query(Role).filter(Role.id == role_id).first()
            if not role:
                return APIResponse.not_found(message=f"Role ID '{role_id}' not found.")

            # Check if new role name already exists (exclude current role)
            if request.name is not None and request.name != role.name:
                existing_role = self.db.query(Role).filter(
                    Role.name == request.name,
                    Role.id != role_id
                ).first()
                if existing_role:
                    return APIResponse.bad_request(message=f"Role name '{request.name}' already exists.")

            # Update basic fields
            if request.name is not None:
                role.name = request.name
            if request.description is not None:
                role.description = request.description

            # Update permissions (replace all)
            if request.permission_ids is not None:
                # Clear existing permissions
                role.permissions.clear()
                
                # Add new permissions
                for permission_id in request.permission_ids:
                    permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
                    if permission:
                        role.permissions.append(permission)

            self.db.commit()
            
            return APIResponse.ok(message=f"Role ID '{role_id}' updated successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")

    def delete_role(self, role_id: int):
        try:
            role = self.db.query(Role).filter(Role.id == role_id).first()
            if not role:
                return APIResponse.not_found(message=f"Role ID '{role_id}' not found.")
            
            self.db.delete(role)
            self.db.commit()

            return APIResponse.ok(message=f"Role ID '{role_id}' deleted successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete role: {str(e)}")