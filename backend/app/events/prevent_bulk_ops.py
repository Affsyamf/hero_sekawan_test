from sqlalchemy import event
from app.core.database import engine

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

# TODO: Prevent bulk delelete and update
# @event.listens_for(engine, "before_execute")
# def prevent_bulk_operations(conn, clauseelement, multiparams, params, execution_options):
#     """
#     Prevent bulk DELETE and UPDATE queries that bypass ORM events.
#     (e.g. session.query(...).delete(), session.query(...).update(),
#     or session.execute(delete(Model)), session.execute(update(Model)) )
#     """
#     stmt_type = clauseelement.__class__.__name__

#     if stmt_type in ("Delete", "Update"):
#         raise RuntimeError(
#             f"Bulk {stmt_type.lower()} operations are disabled.\n"
#             f"Use session.delete(obj) or modify ORM objects individually "
#             f"to trigger audit and soft-delete logic."
#         )
