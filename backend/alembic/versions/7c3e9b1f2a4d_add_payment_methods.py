"""add_payment_methods

Adds a catalog of payment methods relevant to the 4 supported countries
(Angola, China, Republic of the Congo, DR Congo) and lets a buyer record
which one they intend to use on an order. No payment gateway integration —
settlement stays offline/manual, same as today; this only tracks intent.

Revision ID: 7c3e9b1f2a4d
Revises: 9a1f4c2e6b7d
Create Date: 2026-08-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c3e9b1f2a4d'
down_revision: Union[str, None] = '9a1f4c2e6b7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (name, code, [country codes where it's available])
PAYMENT_METHODS = [
    ("Multicaixa Express", "multicaixa_express", ["AO"]),
    ("Unitel Money", "unitel_money", ["AO"]),
    ("Alipay", "alipay", ["CN"]),
    ("WeChat Pay", "wechat_pay", ["CN"]),
    ("UnionPay", "unionpay", ["CN"]),
    ("Airtel Money", "airtel_money", ["CG", "CD"]),
    ("MTN Mobile Money", "mtn_momo", ["CG"]),
    ("Orange Money", "orange_money", ["CD"]),
    ("M-Pesa", "mpesa", ["CD"]),
    ("Transferência bancária", "bank_transfer", ["AO", "CN", "CG", "CD"]),
    ("Dinheiro na entrega", "cash_on_delivery", ["AO", "CG", "CD"]),
]


def upgrade() -> None:
    op.create_table(
        'payment_methods',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('code'),
    )

    bind = op.get_bind()

    payment_methods_table = sa.table(
        'payment_methods', sa.column('name', sa.String), sa.column('code', sa.String)
    )
    op.bulk_insert(
        payment_methods_table,
        [{"name": name, "code": code} for name, code, _ in PAYMENT_METHODS],
    )

    country_ids = dict(bind.execute(sa.text("SELECT code, id FROM countries")).all())
    method_ids = dict(bind.execute(sa.text("SELECT code, id FROM payment_methods")).all())

    op.create_table(
        'payment_method_countries',
        sa.Column('payment_method_id', sa.Integer(), primary_key=True),
        sa.Column('country_id', sa.Integer(), primary_key=True),
        sa.ForeignKeyConstraint(['payment_method_id'], ['payment_methods.id']),
        sa.ForeignKeyConstraint(['country_id'], ['countries.id']),
    )

    links_table = sa.table(
        'payment_method_countries',
        sa.column('payment_method_id', sa.Integer),
        sa.column('country_id', sa.Integer),
    )
    op.bulk_insert(
        links_table,
        [
            {"payment_method_id": method_ids[code], "country_id": country_ids[country_code]}
            for _, code, country_codes in PAYMENT_METHODS
            for country_code in country_codes
        ],
    )

    op.add_column('orders', sa.Column('payment_method_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_orders_payment_method', 'orders', 'payment_methods', ['payment_method_id'], ['id']
    )


def downgrade() -> None:
    op.drop_constraint('fk_orders_payment_method', 'orders', type_='foreignkey')
    op.drop_column('orders', 'payment_method_id')
    op.drop_table('payment_method_countries')
    op.drop_table('payment_methods')
