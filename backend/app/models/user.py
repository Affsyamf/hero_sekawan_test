from sqlalchemy import Column, String, Text, Boolean, Integer, BigInteger, DateTime, ForeignKey, Table, func
from sqlalchemy.orm import relationship
from app.models import Base
from datetime import datetime
from app.models.mixin.TimestampMixin import TimestampMixin

# --- Junction Tables ---

user_role = Table(
    "user_role",
    Base.metadata,
    Column("user_id", BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
)

role_permission = Table(
    "role_permission",
    Base.metadata,
    Column("role_id", BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", BigInteger, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String(120))
    phone_number = Column(String(20))
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    roles = relationship("Role", secondary=user_role, back_populates="users", lazy="selectin")
    tokens = relationship("RefreshTokens", back_populates="user", lazy="selectin")


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)

    users = relationship("User", secondary=user_role, back_populates="roles", lazy="selectin")
    permissions = relationship("Permission", secondary=role_permission, back_populates="roles", lazy="selectin")

class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)

    roles = relationship("Role", secondary=role_permission, back_populates="permissions", lazy="selectin")

class UserLoginLog(Base, TimestampMixin):
    __tablename__ = "user_login_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String(50), nullable=False)
    email = Column(String(120), nullable=False)
    login_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45))
    user_agent = Column(Text)
    status = Column(String(20), nullable=False)
    error_message = Column(Text, nullable=True)
    
class RefreshTokens(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    token = Column(Text, nullable=False)
    user_agent = Column(Text)
    ip_address = Column(Text)

    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    # Relasi ke User
    user = relationship("User", back_populates="tokens", lazy="selectin")
    
    @property
    def is_revoked(self):
        """Check if token is revoked"""
        return self.revoked_at is not None
    
    @property
    def is_expired(self):
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at