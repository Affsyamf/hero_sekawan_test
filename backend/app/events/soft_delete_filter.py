from sqlalchemy import event
from sqlalchemy.orm import Session, with_loader_criteria
from app.models.mixin.AuditMixin import AuditMixin

# Correct Examples
# ========================================================
# product = db.query(Product).filter_by(id=123).first()
# if product:
#     db.delete(product)   # triggers your before_flush -> sets deleted_at / deleted_by
#     db.commit()
#
# product = db.query(Product).filter_by(id=123).first()
# if product:
#     product.name = "New Name"
#     product.unit = "KG"
#     db.commit()

# Wrong examples
# ========================================================
# db.query(Product).filter(Product.id == 123).delete()
# db.commit()

# db.execute(text("DELETE FROM products WHERE id = 123"))
# db.commit()

# stmt = delete(Product).where(Product.id == 123)
# db.execute(stmt)
# db.commit()

# db.query(Product).filter(Product.id == 123).update({"name": "Updated!"})
# db.commit()

# stmt = update(Product).where(Product.id == 123).values(name="Updated!")
# db.execute(stmt)
# db.commit()

# db.execute(text("UPDATE products SET name='Updated!' WHERE id=123"))
# db.commit()

@event.listens_for(Session, "do_orm_execute")
def add_soft_delete_filter(execute_state):
    """
    Automatically add WHERE deleted_at IS NULL for all ORM entities
    that inherit from AuditMixin (have deleted_at column).
    """
    # Skip if explicitly told to include deleted
    if execute_state.execution_options.get("include_deleted", False):
        return

    # Apply loader criteria for all subclasses of AuditMixin
    if execute_state.is_select:
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                AuditMixin,
                lambda cls: cls.deleted_at.is_(None),
                include_aliases=True,
            )
        )

# Optional helper for skipping filter
def with_deleted(session):
    """Return a Session that includes deleted rows."""
    return session.execution_options(include_deleted=True)
