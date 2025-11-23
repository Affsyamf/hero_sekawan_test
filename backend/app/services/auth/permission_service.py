from datetime import datetime

from fastapi import HTTPException
from fastapi.params import Depends
from sqlalchemy import or_, func, and_
from sqlalchemy.orm import joinedload

from app.schemas.input_models.user_input_models import PermissionCreate, PermissionUpdate
from app.core.database import Session, get_db
from app.models.user import Permission, role_permission
from app.utils.datatable.request import ListRequest
from app.utils.response import APIResponse


class PermissionService():
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def list_permission(self, request: ListRequest):
        permissions = self.db.query(
            Permission,
            func.count(role_permission.c.role_id).label('role_count')
        ).outerjoin(role_permission, Permission.id == role_permission.c.permission_id)\
         .group_by(Permission.id)

        if request.q:
            like = f"%{request.q}%"
            permissions = permissions.filter(
                or_(
                    Permission.name.ilike(like),
                    Permission.description.ilike(like)
                )
            )
            
        if request.start_date and request.end_date:
            start = datetime.strptime(request.start_date, '%Y-%m-%d').date()
            end = datetime.strptime(request.end_date, '%Y-%m-%d').date()
            
            permissions = permissions.filter(
                and_(
                    func.date(Permission.created_at) >= start,
                    func.date(Permission.created_at) <= end
                )
            )
            
        if request.sort_by and request.sort_dir:
            sort_col = getattr(Permission, request.sort_by)
            if request.sort_dir.lower() == "desc":
                sort_col = sort_col.desc()
            permissions = permissions.order_by(sort_col)
        
        permissions = permissions.order_by(Permission.id.desc())

        return APIResponse.paginated(permissions, request, lambda row: {
            "id": row.Permission.id,
            "name": row.Permission.name,
            "description": row.Permission.description,
            "role_count": row.role_count or 0,
            "created_at": row.Permission.created_at.isoformat() if row.Permission.created_at else None,
            "updated_at": row.Permission.updated_at.isoformat() if row.Permission.updated_at else None,
        })

    def get_permission(self, permission_id: int):
        permission = self.db.query(Permission).options(
            joinedload(Permission.roles)
        ).filter(Permission.id == permission_id).first()

        if not permission:
            return APIResponse.not_found(message=f"Permission ID '{permission_id}' not found.")

        roles = []
        for role in permission.roles:
            roles.append({
                "id": role.id,
                "name": role.name,
                "description": role.description,
            })

        response = {
            "id": permission.id,
            "name": permission.name,
            "description": permission.description,
            "roles": roles,
            "created_at": permission.created_at.isoformat() if permission.created_at else None,
            "updated_at": permission.updated_at.isoformat() if permission.updated_at else None,
        }

        return APIResponse.ok(data=response)

    def create_permission(self, request: PermissionCreate):
        try:
            # Check if permission name already exists
            existing_permission = self.db.query(Permission).filter(Permission.name == request.name).first()
            if existing_permission:
                return APIResponse.bad_request(message=f"Permission name '{request.name}' already exists.")

            permission = Permission(
                name=request.name,
                description=request.description
            )
            self.db.add(permission)
            self.db.commit()
            self.db.refresh(permission)

            return APIResponse.created(message=f"Permission '{permission.name}' created successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create permission: {str(e)}")

    def update_permission(self, permission_id: int, request: PermissionUpdate):
        try:
            permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
            if not permission:
                return APIResponse.not_found(message=f"Permission ID '{permission_id}' not found.")

            # Check if new permission name already exists (exclude current permission)
            if request.name is not None and request.name != permission.name:
                existing_permission = self.db.query(Permission).filter(
                    Permission.name == request.name,
                    Permission.id != permission_id
                ).first()
                if existing_permission:
                    return APIResponse.bad_request(message=f"Permission name '{request.name}' already exists.")

            # Update basic fields
            if request.name is not None:
                permission.name = request.name
            if request.description is not None:
                permission.description = request.description

            self.db.commit()
            
            return APIResponse.ok(message=f"Permission ID '{permission_id}' updated successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update permission: {str(e)}")

    def delete_permission(self, permission_id: int):
        try:
            permission = self.db.query(Permission).filter(Permission.id == permission_id).first()
            if not permission:
                return APIResponse.not_found(message=f"Permission ID '{permission_id}' not found.")
            
            self.db.delete(permission)
            self.db.commit()

            return APIResponse.ok(message=f"Permission ID '{permission_id}' deleted successfully.")
        
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete permission: {str(e)}")