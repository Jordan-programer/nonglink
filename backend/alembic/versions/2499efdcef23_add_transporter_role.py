"""add_transporter_role

Adds a 'transporter' value to users.role and an optional transporter_id on
orders, so a transporter can claim a confirmed order from the pool and
advance it through shipped -> delivered.

Revision ID: 2499efdcef23
Revises: fce437f5977b
Create Date: 2026-08-06 16:39:39.562421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2499efdcef23'
down_revision: Union[str, None] = 'fce437f5977b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','transporter','admin','superadmin') "
        "NOT NULL DEFAULT 'farmer'"
    )
    op.add_column('orders', sa.Column('transporter_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_orders_transporter', 'orders', 'users', ['transporter_id'], ['id']
    )


def downgrade() -> None:
    op.drop_constraint('fk_orders_transporter', 'orders', type_='foreignkey')
    op.drop_column('orders', 'transporter_id')
    op.execute(
        "UPDATE users SET role = 'buyer' WHERE role = 'transporter'"
    )
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','admin','superadmin') "
        "NOT NULL DEFAULT 'farmer'"
    )
