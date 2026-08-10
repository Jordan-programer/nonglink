"""add_countries_multi_country_regions

Expands AgriLink from Angola-only to 4 countries: Angola, China, República
do Congo (Congo-Brazzaville) and República Democrática do Congo. Adds a
countries table, links regions to a country, backfills the existing 18
Angolan regions to Angola, and seeds provincial/departmental regions for
the 3 new countries.

Revision ID: d816ca89ddc5
Revises: 771ae14e1304
Create Date: 2026-08-04 19:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd816ca89ddc5'
down_revision: Union[str, None] = '80e04659ddb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


COUNTRIES = [
    ("Angola", "AO"),
    ("China", "CN"),
    ("República do Congo", "CG"),
    ("República Democrática do Congo", "CD"),
]

# Mainland China: 22 provinces + 4 municipalities + 5 autonomous regions.
CHINA_REGIONS = [
    "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong",
    "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan",
    "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi", "Jilin",
    "Liaoning", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai",
    "Shanxi", "Sichuan", "Tianjin", "Tibet", "Xinjiang", "Yunnan",
    "Zhejiang",
]

# Republic of the Congo (Congo-Brazzaville): 12 departments.
CONGO_REGIONS = [
    "Bouenza", "Brazzaville", "Cuvette", "Cuvette-Ouest", "Kouilou",
    "Lékoumou", "Likouala", "Niari", "Plateaux", "Pointe-Noire", "Pool",
    "Sangha",
]

# DR Congo: 26 provinces (post-2015 split).
DRC_REGIONS = [
    "Bas-Uélé", "Équateur", "Haut-Katanga", "Haut-Lomami", "Haut-Uélé",
    "Ituri", "Kasaï", "Kasaï-Central", "Kasaï-Oriental", "Kinshasa",
    "Kongo Central", "Kwango", "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe",
    "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi", "Sankuru",
    "Sud-Kivu", "Sud-Ubangi", "Tanganyika", "Tshopo", "Tshuapa",
]


def upgrade() -> None:
    op.create_table(
        'countries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('code', sa.String(3), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('code'),
    )

    bind = op.get_bind()

    countries_table = sa.table(
        'countries', sa.column('name', sa.String), sa.column('code', sa.String)
    )
    op.bulk_insert(countries_table, [{"name": n, "code": c} for n, c in COUNTRIES])

    country_ids = dict(bind.execute(sa.text("SELECT code, id FROM countries")).all())

    # regions.name was globally UNIQUE; now it only needs to be unique per country.
    op.execute("ALTER TABLE regions DROP INDEX name")

    op.add_column('regions', sa.Column('country_id', sa.Integer(), nullable=True))
    op.execute(f"UPDATE regions SET country_id = {country_ids['AO']}")
    op.alter_column(
        'regions', 'country_id', existing_type=sa.Integer(), nullable=False
    )
    op.create_foreign_key(
        'fk_regions_country', 'regions', 'countries', ['country_id'], ['id']
    )
    op.create_unique_constraint(
        'uq_regions_country_name', 'regions', ['country_id', 'name']
    )

    regions_table = sa.table(
        'regions', sa.column('name', sa.String), sa.column('country_id', sa.Integer)
    )
    op.bulk_insert(
        regions_table,
        [{"name": n, "country_id": country_ids["CN"]} for n in CHINA_REGIONS]
        + [{"name": n, "country_id": country_ids["CG"]} for n in CONGO_REGIONS]
        + [{"name": n, "country_id": country_ids["CD"]} for n in DRC_REGIONS],
    )


def downgrade() -> None:
    op.drop_constraint('uq_regions_country_name', 'regions', type_='unique')
    op.execute(
        "DELETE regions FROM regions JOIN countries ON regions.country_id = countries.id "
        "WHERE countries.code != 'AO'"
    )
    op.drop_constraint('fk_regions_country', 'regions', type_='foreignkey')
    op.drop_column('regions', 'country_id')
    op.execute("ALTER TABLE regions ADD UNIQUE KEY name (name)")
    op.drop_table('countries')
