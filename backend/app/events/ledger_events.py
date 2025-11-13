from sqlalchemy import event
from app.models import (PurchasingDetail, Purchasing, 
                       StockMovement, StockMovementDetail,
                       ColorKitchenEntry, ColorKitchenEntryDetail,
                       ColorKitchenBatch, ColorKitchenBatchDetail,
                       Ledger)
from app.models.enum.ledger_enum import LedgerRef, LedgerLocation
from app.utils.event_flags import should_skip_cost_cache_updates
from app.utils.cost_helper import update_avg_cost_for_products

#region Purchasing
def _get_purchasing(connection, purchasing_id):
    return connection.execute(
        Purchasing.__table__.select().where(Purchasing.id == purchasing_id)
    ).fetchone()


@event.listens_for(PurchasingDetail, "after_insert")
def create_ledger_entry(mapper, connection, target):
    # if not should_skip_cost_cache_updates():
    update_avg_cost_for_products(connection, [target.product_id])
    
    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return
    

    connection.execute(
        Ledger.__table__.insert().values(
            date=purchasing.date,
            ref=LedgerRef.Purchasing.value,
            ref_code=purchasing.code or "",
            location=LedgerLocation.Gudang.value,
            quantity_in=target.quantity or 0.0,
            quantity_out=0.0,
            product_id=target.product_id,
        )
    )


@event.listens_for(PurchasingDetail, "after_update")
def update_ledger_entry(mapper, connection, target):
    # if not should_skip_cost_cache_updates():
    update_avg_cost_for_products(connection, [target.product_id])
    
    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return

    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Purchasing.value)
        .where(Ledger.ref_code == (purchasing.code or ""))
        .where(Ledger.product_id == target.product_id)
        .values(
            date=purchasing.date,
            quantity_in=target.quantity or 0.0,
        )
    )


@event.listens_for(PurchasingDetail, "after_delete")
def delete_ledger_entry(mapper, connection, target):
    # if not should_skip_cost_cache_updates():
    update_avg_cost_for_products(connection, [target.product_id])

    purchasing = _get_purchasing(connection, target.purchasing_id)
    if not purchasing:
        return

    connection.execute(
        Ledger.__table__.delete()
        .where(Ledger.ref == LedgerRef.Purchasing.value)
        .where(Ledger.ref_code == (purchasing.code or ""))
        .where(Ledger.product_id == target.product_id)
    )
#endregion Purchasing

#region Stock Movement
def _get_stock_movement(connection, stock_movement_id):
    return connection.execute(
        StockMovement.__table__.select().where(StockMovement.id == stock_movement_id)
    ).fetchone()

@event.listens_for(StockMovementDetail, "after_insert")
def create_ledger_from_stock_movement(mapper, connection, target):
    movement = _get_stock_movement(connection, target.stock_movement_id)
    if not movement:
        return

    # Row 1: OUT from Gudang
    connection.execute(
        Ledger.__table__.insert().values(
            date=movement.date,
            ref=LedgerRef.StockMovement.value,
            ref_code=movement.code or "",
            location=LedgerLocation.Gudang.value,
            quantity_in=0.0,
            quantity_out=target.quantity or 0.0,
            product_id=target.product_id,
        )
    )

    # Row 2: IN into Kitchen
    connection.execute(
        Ledger.__table__.insert().values(
            date=movement.date,
            ref=LedgerRef.StockMovement.value,
            ref_code=movement.code or "",
            location=LedgerLocation.Kitchen.value,
            quantity_in=target.quantity or 0.0,
            quantity_out=0.0,
            product_id=target.product_id,
        )
    )

@event.listens_for(StockMovementDetail, "after_update")
def update_ledger_from_stock_movement(mapper, connection, target):
    movement = _get_stock_movement(connection, target.stock_movement_id)
    if not movement:
        return

    # Update Gudang row
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.StockMovement.value)
        .where(Ledger.ref_code == (movement.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Gudang.value)
        .values(
            date=movement.date,
            quantity_in=0.0,
            quantity_out=target.quantity or 0.0,
        )
    )

    # Update Kitchen row
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.StockMovement.value)
        .where(Ledger.ref_code == (movement.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Kitchen.value)
        .values(
            date=movement.date,
            quantity_in=target.quantity or 0.0,
            quantity_out=0.0,
        )
    )

@event.listens_for(StockMovementDetail, "after_delete")
def delete_ledger_from_stock_movement(mapper, connection, target):
    movement = _get_stock_movement(connection, target.stock_movement_id)
    if not movement:
        return

    connection.execute(
        Ledger.__table__.delete()
        .where(Ledger.ref == LedgerRef.StockMovement.value)
        .where(Ledger.ref_code == (movement.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location.in_([LedgerLocation.Gudang.value, LedgerLocation.Kitchen.value]))
    )
#endregion Stock Movement

#region Color Kitchen
def _get_ck_entry(connection, entry_id):
    return connection.execute(
        ColorKitchenEntry.__table__.select().where(ColorKitchenEntry.id == entry_id)
    ).fetchone()

@event.listens_for(ColorKitchenEntryDetail, "after_insert")
def create_ledger_from_ck(mapper, connection, target):
    entry = _get_ck_entry(connection, target.color_kitchen_entry_id)
    if not entry:
        return

    # Kitchen OUT
    connection.execute(
        Ledger.__table__.insert().values(
            date=entry.date,
            ref=LedgerRef.Ck.value,
            ref_code=entry.code or "",
            location=LedgerLocation.Kitchen.value,
            quantity_in=0.0,
            quantity_out=target.quantity or 0.0,
            product_id=target.product_id,
        )
    )

    # Usage IN
    connection.execute(
        Ledger.__table__.insert().values(
            date=entry.date,
            ref=LedgerRef.Ck.value,
            ref_code=entry.code or "",
            location=LedgerLocation.Usage.value,
            quantity_in=target.quantity or 0.0,
            quantity_out=0.0,
            product_id=target.product_id,
        )
    )

@event.listens_for(ColorKitchenEntryDetail, "after_update")
def update_ledger_from_ck(mapper, connection, target):
    entry = _get_ck_entry(connection, target.color_kitchen_entry_id)
    if not entry:
        return

    # Kitchen OUT
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (entry.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Kitchen.value)
        .values(date=entry.date, quantity_in=0.0, quantity_out=target.quantity or 0.0)
    )

    # Usage IN
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (entry.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Usage.value)
        .values(date=entry.date, quantity_in=target.quantity or 0.0, quantity_out=0.0)
    )

@event.listens_for(ColorKitchenEntryDetail, "after_delete")
def delete_ledger_from_ck(mapper, connection, target):
    entry = _get_ck_entry(connection, target.color_kitchen_entry_id)
    if not entry:
        return

    connection.execute(
        Ledger.__table__.delete()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (entry.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location.in_([LedgerLocation.Kitchen.value, LedgerLocation.Usage.value]))
    )
    
def _get_ck_batch(connection, batch_id):
    return connection.execute(
        ColorKitchenBatch.__table__.select().where(ColorKitchenBatch.id == batch_id)
    ).fetchone()
    
@event.listens_for(ColorKitchenBatchDetail, "after_insert")
def create_ledger_from_ck_batch(mapper, connection, target):
    batch = _get_ck_batch(connection, target.batch_id)
    if not batch:
        return
    
    # Kitchen OUT
    connection.execute(
        Ledger.__table__.insert().values(
            date=batch.date,
            ref=LedgerRef.Ck.value,
            ref_code=batch.code or "",
            location=LedgerLocation.Kitchen.value,
            quantity_in=0.0,
            quantity_out=target.quantity or 0.0,
            product_id=target.product_id,
        )
    )

    # Usage IN
    connection.execute(
        Ledger.__table__.insert().values(
            date=batch.date,
            ref=LedgerRef.Ck.value,
            ref_code=batch.code or "",
            location=LedgerLocation.Usage.value,
            quantity_in=target.quantity or 0.0,
            quantity_out=0.0,
            product_id=target.product_id,
        )
    )

@event.listens_for(ColorKitchenBatchDetail, "after_update")
def update_ledger_from_ck_batch(mapper, connection, target):
    batch = _get_ck_batch(connection, target.batch_id)
    if not batch:
        return
    # Kitchen OUT
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (batch.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Kitchen.value)
        .values(date=batch.date, quantity_in=0.0, quantity_out=target.quantity or 0.0)
    )

    # Usage IN
    connection.execute(
        Ledger.__table__.update()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (batch.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location == LedgerLocation.Usage.value)
        .values(date=batch.date, quantity_in=target.quantity or 0.0, quantity_out=0.0)
    )

@event.listens_for(ColorKitchenBatchDetail, "after_delete")
def delete_ledger_from_ck_batch(mapper, connection, target):
    batch = _get_ck_batch(connection, target.batch_id)
    if not batch:
        return
    connection.execute(
        Ledger.__table__.delete()
        .where(Ledger.ref == LedgerRef.Ck.value)
        .where(Ledger.ref_code == (batch.code or ""))
        .where(Ledger.product_id == target.product_id)
        .where(Ledger.location.in_([LedgerLocation.Kitchen.value, LedgerLocation.Usage.value]))
    )
#endregion Color Kitchen