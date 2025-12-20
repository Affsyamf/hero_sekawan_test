# app/seeder/user_seeder.py

from app.core.database import SessionLocal
from app.models.user import User, Role
from passlib.context import CryptContext
from sqlalchemy.orm import Session

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEFAULT_ADMIN = {
    "username": "a",
    "email": "superadmin@example.com",
    "password": "b",
    "full_name": "Super Admin",
    "phone_number": None,
}

def seed_super_admin():
    print("\n🚀 Running SuperAdmin Seeder...")

    db: Session = SessionLocal()
    try:
        # Check if user exists
        existing = (
            db.query(User)
            .filter(User.username == DEFAULT_ADMIN["username"])
            .first()
        )

        if existing:
            print("✔ SuperAdmin already exists. Skipping creation.\n")
            return

        # Fetch SUPERADMIN role
        superadmin_role = db.query(Role).filter(Role.name == "Superadmin").first()

        if not superadmin_role:
            raise Exception(
                "❌ Role 'Superadmin' not found. "
                "Run RBAC seeder first: python app/seeder/rbac_seeder.py"
            )

        print("🔄 Creating SuperAdmin user...")

        user = User(
            username=DEFAULT_ADMIN["username"],
            email=DEFAULT_ADMIN["email"],
            full_name=DEFAULT_ADMIN["full_name"],
            phone_number=DEFAULT_ADMIN["phone_number"],
            password_hash=password_context.hash(DEFAULT_ADMIN["password"]),
            is_active=True,
            is_verified=True,
        )

        user.roles.append(superadmin_role)

        db.add(user)
        db.commit()

        print("🎉 SuperAdmin created successfully!")
        print(f"   → username: {DEFAULT_ADMIN['username']}")
        print(f"   → password: {DEFAULT_ADMIN['password']}\n")

    except Exception as e:
        db.rollback()
        print("❌ Failed to seed SuperAdmin. Rolled back.")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_super_admin()
