"""added purchasing status

Revision ID: f0c57f5fd06a
Revises: ed212d899161
Create Date: 2025-12-19 01:05:01.751725

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f0c57f5fd06a'
down_revision: Union[str, None] = 'ed212d899161'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.execute("""
        CREATE TYPE purchasing_status_enum
        AS ENUM ('received', 'paid')
    """)

    # 2️⃣ Then add the column
    op.add_column(
        'purchasing_details',
        sa.Column(
            'status',
            sa.Enum(
                'received',
                'paid',
                name='purchasing_status_enum'
            ),
            nullable=True
        )
    )

def downgrade():
    op.drop_column('purchasing_details', 'status')
    op.execute("DROP TYPE purchasing_status_enum")
