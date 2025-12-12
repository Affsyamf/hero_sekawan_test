"""remove default ppn

Revision ID: e279fa0cec8c
Revises: cc9ab94f63c2
Create Date: 2025-12-12 15:58:50.735413

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e279fa0cec8c'
down_revision: Union[str, None] = 'cc9ab94f63c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.alter_column(
        'sales',
        'ppn',
        server_default=None
    )


def downgrade():
    op.alter_column(
        'sales',
        'ppn',
        server_default='0'
    )
