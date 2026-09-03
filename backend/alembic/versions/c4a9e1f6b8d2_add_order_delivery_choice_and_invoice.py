"""add_order_delivery_choice_and_invoice

Adds `needs_delivery` (the buyer's explicit choice, made at checkout,
between platform-arranged delivery and self-pickup — the delivery fee
is only computed and added to the order total when this is true) and
`invoice_url` (the generated PDF invoice, produced once payment is
confirmed) to orders.

Revision ID: c4a9e1f6b8d2
Revises: b7f21e9c4a03
Create Date: 2026-09-03 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4a9e1f6b8d2'
down_revision: Union[str, None] = 'b7f21e9c4a03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'orders',
        sa.Column('needs_delivery', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column('orders', sa.Column('invoice_url', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('orders', 'invoice_url')
    op.drop_column('orders', 'needs_delivery')
