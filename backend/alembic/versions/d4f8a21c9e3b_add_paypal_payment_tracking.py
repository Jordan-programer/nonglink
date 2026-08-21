"""add_paypal_payment_tracking

Adds online payment tracking to orders (payment_status, paypal_order_id,
paypal_capture_id) and seeds a "PayPal" payment method available in every
existing country. The prior payment_methods scaffold only tracked offline
payment intent — this is the first real payment gateway.

Revision ID: d4f8a21c9e3b
Revises: 7c3e9b1f2a4d
Create Date: 2026-08-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f8a21c9e3b'
down_revision: Union[str, None] = '7c3e9b1f2a4d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'orders',
        sa.Column(
            'payment_status',
            sa.Enum('pending', 'paid', 'failed', name='paymentstatus'),
            nullable=False,
            server_default='pending',
        ),
    )
    op.add_column('orders', sa.Column('paypal_order_id', sa.String(64), nullable=True))
    op.add_column('orders', sa.Column('paypal_capture_id', sa.String(64), nullable=True))

    payment_methods = sa.table(
        'payment_methods',
        sa.column('id', sa.Integer),
        sa.column('name', sa.String),
        sa.column('code', sa.String),
    )
    op.bulk_insert(payment_methods, [{'name': 'PayPal', 'code': 'paypal'}])

    conn = op.get_bind()
    paypal_id = conn.execute(
        sa.text("SELECT id FROM payment_methods WHERE code = 'paypal'")
    ).scalar_one()
    country_ids = [row[0] for row in conn.execute(sa.text("SELECT id FROM countries"))]

    payment_method_countries = sa.table(
        'payment_method_countries',
        sa.column('payment_method_id', sa.Integer),
        sa.column('country_id', sa.Integer),
    )
    if country_ids:
        op.bulk_insert(
            payment_method_countries,
            [{'payment_method_id': paypal_id, 'country_id': cid} for cid in country_ids],
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text(
        "DELETE FROM payment_method_countries WHERE payment_method_id = "
        "(SELECT id FROM payment_methods WHERE code = 'paypal')"
    ))
    conn.execute(sa.text("DELETE FROM payment_methods WHERE code = 'paypal'"))

    op.drop_column('orders', 'paypal_capture_id')
    op.drop_column('orders', 'paypal_order_id')
    op.drop_column('orders', 'payment_status')
