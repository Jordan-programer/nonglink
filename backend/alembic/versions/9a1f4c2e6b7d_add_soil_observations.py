"""add_soil_observations

Adds a boundary_geojson column to farms (the polygon the farmer draws on
the map) and a soil_observations table storing satellite-derived soil
metrics (NDMI, LST, NDTI, salinity index) computed remotely via Google
Earth Engine from Landsat 8/9 imagery — no physical sensors involved.

Revision ID: 9a1f4c2e6b7d
Revises: 3e6228de8a20
Create Date: 2026-08-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a1f4c2e6b7d'
down_revision: Union[str, None] = '3e6228de8a20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('farms', sa.Column('boundary_geojson', sa.Text(), nullable=True))

    op.create_table(
        'soil_observations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.Enum('landsat_8', 'landsat_9', name='satellitesource'), nullable=False),
        sa.Column('acquisition_date', sa.Date(), nullable=False),
        sa.Column('cloud_cover_pct', sa.Float(), nullable=False),
        sa.Column('ndmi_mean', sa.Float(), nullable=True),
        sa.Column('ndmi_min', sa.Float(), nullable=True),
        sa.Column('ndmi_max', sa.Float(), nullable=True),
        sa.Column('lst_celsius_mean', sa.Float(), nullable=True),
        sa.Column('lst_celsius_min', sa.Float(), nullable=True),
        sa.Column('lst_celsius_max', sa.Float(), nullable=True),
        sa.Column('ndti_mean', sa.Float(), nullable=True),
        sa.Column('ndti_min', sa.Float(), nullable=True),
        sa.Column('ndti_max', sa.Float(), nullable=True),
        sa.Column('salinity_index_mean', sa.Float(), nullable=True),
        sa.Column('salinity_index_min', sa.Float(), nullable=True),
        sa.Column('salinity_index_max', sa.Float(), nullable=True),
        sa.Column('ndvi_mean', sa.Float(), nullable=True),
        sa.Column('ndvi_min', sa.Float(), nullable=True),
        sa.Column('ndvi_max', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id']),
    )


def downgrade() -> None:
    op.drop_table('soil_observations')
    op.drop_column('farms', 'boundary_geojson')
