# app/seeder/rbac_seeder.py
from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app.core.database import SessionLocal
from app.models.user import Role, Permission

import app.rbac.atomic_permissions as atomic
import app.rbac.roles as role_defs


# ---------------------------------------------
# HELPERS
# ---------------------------------------------

def collect_atomic_permissions() -> set[str]:
    """Automatically collect ALL permission strings from atomic_permissions.py"""
    return {
        value
        for key, value in atomic.__dict__.items()
        if isinstance(value, str) and not key.startswith("_")
    }


def collect_roles() -> dict[str, list[str]]:
    """
    Find all constants in roles.py that start with ROLE_.
    Example: ROLE_ADMIN → role name "Admin"
    """
    roles = {}

    for key, value in role_defs.__dict__.items():
        if key.startswith("ROLE_") and isinstance(value, list):
            clean_name = key.replace("ROLE_", "").title()
            roles[clean_name] = value

    return roles


# ---------------------------------------------
# SEEDER LOGIC
# ---------------------------------------------

def seed_permissions(db: Session, atomic_perms: set[str]):
    print("🔄 Syncing permissions...")

    existing_perms = {
        p.name: p for p in db.query(Permission).all()
    }

    # ADD new permissions
    for perm in atomic_perms:
        if perm not in existing_perms:
            db.add(Permission(name=perm))
            print(f"  [ADD] Permission: {perm}")

    # REMOVE permissions no longer in code
    for perm_name, perm_obj in existing_perms.items():
        if perm_name not in atomic_perms:
            print(f"  [DEL] Permission removed (not in code): {perm_name}")
            db.delete(perm_obj)

    db.flush()
    print(f"✔ Permission sync complete ({len(atomic_perms)} active)")


def seed_roles(db: Session, role_map: dict[str, list[str]]):
    print("🔄 Syncing roles...")

    for role_name, perm_list in role_map.items():
        role = db.query(Role).filter_by(name=role_name).first()

        if not role:
            role = Role(name=role_name)
            db.add(role)
            db.flush()
            print(f"  [ADD] Role created: {role_name}")

        # Fetch permissions from DB by exact name
        permissions = db.query(Permission).filter(Permission.name.in_(perm_list)).all()

        old_count = len(role.permissions)
        new_count = len(permissions)

        role.permissions = permissions

        diff_add = new_count - old_count
        if diff_add != 0:
            print(f"  [SYNC] Role {role_name}: Now has {new_count} permissions")

    print(f"✔ Role sync complete ({len(role_map)} roles)")


# ---------------------------------------------
# MAIN RUN FUNCTION
# ---------------------------------------------

def run():
    print("\n🚀 Running RBAC Seeder...")

    db = SessionLocal()
    try:
        atomic_perms = collect_atomic_permissions()
        role_map = collect_roles()

        db.begin()  # Transaction start

        seed_permissions(db, atomic_perms)
        seed_roles(db, role_map)

        db.commit()  # Commit transaction
        print("🎉 RBAC seeding completed!\n")
    except Exception as e:
        db.rollback()
        print("❌ RBAC seeding failed, rolled back!")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
