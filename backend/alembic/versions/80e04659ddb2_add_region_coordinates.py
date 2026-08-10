"""add_region_coordinates

Adds latitude/longitude to regions, seeded with the real coordinates of
each Angolan province's capital city (resolved via Open-Meteo's free
geocoding API, backed by GeoNames, and verified individually in this
session). Used by the price-forecast weather features — one representative
point per region rather than per-farm, since forecasts are computed at the
crop+region grain.

Revision ID: 80e04659ddb2
Revises: 771ae14e1304
Create Date: 2026-08-04 18:20:42.404116

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '80e04659ddb2'
down_revision: Union[str, None] = '771ae14e1304'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# name -> (capital city, latitude, longitude)
REGION_COORDINATES = {
    "Bengo": (-8.57848, 13.66425),
    "Benguela": (-12.57674, 13.40268),
    "Bié": (-12.38333, 16.93333),
    "Cabinda": (-5.56198, 12.19476),
    "Cuando Cubango": (-14.6585, 17.69099),
    "Cuanza Norte": (-9.27519, 14.97724),
    "Cuanza Sul": (-11.20605, 13.84371),
    "Cunene": (-17.06667, 15.73333),
    "Huambo": (-12.77611, 15.73917),
    "Huíla": (-14.91717, 13.4925),
    "Luanda": (-8.83682, 13.23432),
    "Lunda Norte": (-7.36643, 20.81557),
    "Lunda Sul": (-9.66078, 20.39155),
    "Malanje": (-9.54015, 16.34096),
    "Moxico": (-11.78333, 19.91667),
    "Namibe": (-15.2612, 12.1468),
    "Uíge": (-7.60874, 15.06131),
    "Zaire": (-6.26667, 14.23833),
}


def upgrade() -> None:
    op.add_column("regions", sa.Column("latitude", sa.Float(), nullable=True))
    op.add_column("regions", sa.Column("longitude", sa.Float(), nullable=True))

    conn = op.get_bind()
    for name, (lat, lon) in REGION_COORDINATES.items():
        conn.execute(
            sa.text(
                "UPDATE regions SET latitude = :lat, longitude = :lon WHERE name = :name"
            ),
            {"lat": lat, "lon": lon, "name": name},
        )


def downgrade() -> None:
    op.drop_column("regions", "longitude")
    op.drop_column("regions", "latitude")
