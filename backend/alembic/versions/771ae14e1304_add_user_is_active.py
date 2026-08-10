"""add_user_is_active

Adds users.is_active so admins can suspend accounts without deleting them.
Suspended users are rejected at login and on every authenticated request.

Revision ID: 771ae14e1304
Revises: b8e42e7f14b5
Create Date: 2026-08-04 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '771ae14e1304'
down_revision: Union[str, None] = 'b8e42e7f14b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
    )


def downgrade() -> None:
    op.drop_column('users', 'is_active')
