"""curate_payment_methods

The new dedicated payment page shows a logo for each method, and there's
no brand mark for a generic "bank transfer" or "cash on delivery" — so
those two are dropped from the catalog. (PayPal was already seeded by the
prior migration, available in all 4 countries.)

Revision ID: 1e8b6f3a9c2d
Revises: d4f8a21c9e3b
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e8b6f3a9c2d'
down_revision: Union[str, None] = 'd4f8a21c9e3b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

REMOVED = [
    ("bank_transfer", "Transferência bancária", ["AO", "CN", "CG", "CD"]),
    ("cash_on_delivery", "Dinheiro na entrega", ["AO", "CG", "CD"]),
]


def upgrade() -> None:
    bind = op.get_bind()

    removed_ids = [
        row[0]
        for row in bind.execute(
            sa.text("SELECT id FROM payment_methods WHERE code IN :codes").bindparams(
                sa.bindparam("codes", expanding=True)
            ),
            {"codes": [code for code, _, _ in REMOVED]},
        ).all()
    ]
    if not removed_ids:
        return

    bind.execute(
        sa.text(
            "DELETE FROM payment_method_countries WHERE payment_method_id IN :ids"
        ).bindparams(sa.bindparam("ids", expanding=True)),
        {"ids": removed_ids},
    )
    bind.execute(
        sa.text("UPDATE orders SET payment_method_id = NULL WHERE payment_method_id IN :ids").bindparams(
            sa.bindparam("ids", expanding=True)
        ),
        {"ids": removed_ids},
    )
    bind.execute(
        sa.text("DELETE FROM payment_methods WHERE id IN :ids").bindparams(
            sa.bindparam("ids", expanding=True)
        ),
        {"ids": removed_ids},
    )


def downgrade() -> None:
    bind = op.get_bind()
    country_ids = dict(bind.execute(sa.text("SELECT code, id FROM countries")).all())

    payment_methods_table = sa.table(
        'payment_methods', sa.column('name', sa.String), sa.column('code', sa.String)
    )
    op.bulk_insert(
        payment_methods_table,
        [{"name": name, "code": code} for code, name, _ in REMOVED],
    )

    restored_ids = dict(
        bind.execute(
            sa.text("SELECT code, id FROM payment_methods WHERE code IN :codes").bindparams(
                sa.bindparam("codes", expanding=True)
            ),
            {"codes": [code for code, _, _ in REMOVED]},
        ).all()
    )

    links_table = sa.table(
        'payment_method_countries',
        sa.column('payment_method_id', sa.Integer),
        sa.column('country_id', sa.Integer),
    )
    op.bulk_insert(
        links_table,
        [
            {"payment_method_id": restored_ids[code], "country_id": country_ids[c]}
            for code, _, country_codes in REMOVED
            for c in country_codes
        ],
    )
