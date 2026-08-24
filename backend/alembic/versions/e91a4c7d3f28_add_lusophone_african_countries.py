"""add_lusophone_african_countries

Adds the remaining PALOP countries (Portuguese-speaking African countries)
to the platform's supported markets: Mozambique, Cape Verde,
Guinea-Bissau, and São Tomé and Príncipe (Angola is already supported),
each seeded with their real administrative regions.

Also extends the payment methods catalog to these markets using real,
already-established local payment rails that already have a logo asset
in the frontend: M-Pesa in Mozambique (Vodacom) and Orange Money in
Guinea-Bissau, plus PayPal everywhere. Cape Verde's dominant network
(Vinti4) and a local option for São Tomé and Príncipe are intentionally
left unseeded — no logo asset exists for them yet, and the curated
payment-methods catalog only lists methods with a real logo (see
1e8b6f3a9c2d_curate_payment_methods.py).

Revision ID: e91a4c7d3f28
Revises: d7f3b8a6c1e5
Create Date: 2026-08-23 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e91a4c7d3f28'
down_revision: Union[str, None] = 'd7f3b8a6c1e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


COUNTRIES = [
    ("Moçambique", "MZ"),
    ("Cabo Verde", "CV"),
    ("Guiné-Bissau", "GW"),
    ("São Tomé e Príncipe", "ST"),
]

MOZAMBIQUE_REGIONS = [
    "Niassa", "Cabo Delgado", "Nampula", "Zambézia", "Tete", "Manica",
    "Sofala", "Inhambane", "Gaza", "Maputo Província", "Maputo Cidade",
]

CAPE_VERDE_REGIONS = [
    "Santiago", "Santo Antão", "São Vicente", "Fogo", "Sal", "Boa Vista",
    "São Nicolau", "Maio", "Brava",
]

GUINEA_BISSAU_REGIONS = [
    "Bafatá", "Biombo", "Bolama", "Cacheu", "Gabú", "Oio", "Quinara",
    "Tombali", "Bissau",
]

SAO_TOME_REGIONS = [
    "Água Grande", "Cantagalo", "Caué", "Lembá", "Lobata", "Mé-Zóchi",
    "Príncipe",
]


def upgrade() -> None:
    bind = op.get_bind()

    countries_table = sa.table(
        'countries',
        sa.column('name', sa.String),
        sa.column('code', sa.String),
    )
    op.bulk_insert(countries_table, [{"name": n, "code": c} for n, c in COUNTRIES])

    country_ids = dict(bind.execute(sa.text("SELECT code, id FROM countries")).all())

    regions_table = sa.table(
        'regions',
        sa.column('name', sa.String),
        sa.column('country_id', sa.Integer),
    )
    op.bulk_insert(
        regions_table,
        [{"name": n, "country_id": country_ids["MZ"]} for n in MOZAMBIQUE_REGIONS]
        + [{"name": n, "country_id": country_ids["CV"]} for n in CAPE_VERDE_REGIONS]
        + [{"name": n, "country_id": country_ids["GW"]} for n in GUINEA_BISSAU_REGIONS]
        + [{"name": n, "country_id": country_ids["ST"]} for n in SAO_TOME_REGIONS],
    )

    payment_method_ids = dict(
        bind.execute(sa.text("SELECT code, id FROM payment_methods")).all()
    )
    pmc_table = sa.table(
        'payment_method_countries',
        sa.column('payment_method_id', sa.Integer),
        sa.column('country_id', sa.Integer),
    )
    new_associations = (
        [{"payment_method_id": payment_method_ids["paypal"], "country_id": country_ids[c]}
         for c in ("MZ", "CV", "GW", "ST")]
        + [{"payment_method_id": payment_method_ids["mpesa"], "country_id": country_ids["MZ"]}]
        + [{"payment_method_id": payment_method_ids["orange_money"], "country_id": country_ids["GW"]}]
    )
    op.bulk_insert(pmc_table, new_associations)


def downgrade() -> None:
    bind = op.get_bind()
    codes = ("MZ", "CV", "GW", "ST")
    country_ids = dict(
        bind.execute(
            sa.text("SELECT code, id FROM countries WHERE code IN :codes").bindparams(
                sa.bindparam("codes", expanding=True)
            ),
            {"codes": list(codes)},
        ).all()
    )
    if country_ids:
        ids = list(country_ids.values())
        bind.execute(
            sa.text(
                "DELETE FROM payment_method_countries WHERE country_id IN :ids"
            ).bindparams(sa.bindparam("ids", expanding=True)),
            {"ids": ids},
        )
        bind.execute(
            sa.text("UPDATE users SET country_id = NULL WHERE country_id IN :ids").bindparams(
                sa.bindparam("ids", expanding=True)
            ),
            {"ids": ids},
        )
        region_ids = [
            r[0]
            for r in bind.execute(
                sa.text("SELECT id FROM regions WHERE country_id IN :ids").bindparams(
                    sa.bindparam("ids", expanding=True)
                ),
                {"ids": ids},
            ).all()
        ]
        if region_ids:
            bind.execute(
                sa.text("UPDATE users SET region_id = NULL WHERE region_id IN :rids").bindparams(
                    sa.bindparam("rids", expanding=True)
                ),
                {"rids": region_ids},
            )
            bind.execute(
                sa.text("UPDATE farms SET region_id = NULL WHERE region_id IN :rids").bindparams(
                    sa.bindparam("rids", expanding=True)
                ),
                {"rids": region_ids},
            )
        bind.execute(
            sa.text("DELETE FROM regions WHERE country_id IN :ids").bindparams(
                sa.bindparam("ids", expanding=True)
            ),
            {"ids": ids},
        )
        bind.execute(
            sa.text("DELETE FROM countries WHERE id IN :ids").bindparams(
                sa.bindparam("ids", expanding=True)
            ),
            {"ids": ids},
        )
