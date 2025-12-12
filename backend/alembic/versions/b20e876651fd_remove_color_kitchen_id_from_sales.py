"""remove color_kitchen_id from sales

Revision ID: b20e876651fd
Revises: e279fa0cec8c
Create Date: 2025-12-12 16:58:42.940836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b20e876651fd'
down_revision: Union[str, None] = 'e279fa0cec8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Hapus foreign key constraint
    op.drop_constraint(
        'sales_color_kitchen_id_fkey',
        'sales',
        type_='foreignkey'
    )

    # Hapus kolom color_kitchen_id di tabel sales
    op.drop_column('sales', 'color_kitchen_id')

def downgrade() -> None:
    op.add_column(
        'sales',
        sa.Column('color_kitchen_id', sa.Integer(), nullable=True)
    )

    op.create_foreign_key(
        'sales_color_kitchen_id_fkey',
        'sales',
        'color_kitchen_entries',
        ['color_kitchen_id'],
        ['id'],
        ondelete="RESTRICT"
    )