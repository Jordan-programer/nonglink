"""add_transport_routes

Lets a transporter register the origin -> destination region pairs they
service, so they can be matched against the busiest actual delivery
corridors (derived from real order data) surfaced via /transport/routes/popular.

Revision ID: 3e6228de8a20
Revises: 2499efdcef23
Create Date: 2026-08-06 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e6228de8a20'
down_revision: Union[str, None] = '2499efdcef23'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'transport_routes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('transporter_id', sa.Integer(), nullable=False),
        sa.Column('origin_region_id', sa.Integer(), nullable=False),
        sa.Column('destination_region_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['transporter_id'], ['users.id']),
        sa.ForeignKeyConstraint(['origin_region_id'], ['regions.id']),
        sa.ForeignKeyConstraint(['destination_region_id'], ['regions.id']),
        sa.UniqueConstraint(
            'transporter_id', 'origin_region_id', 'destination_region_id',
            name='uq_transporter_route',
        ),
    )


def downgrade() -> None:
    op.drop_table('transport_routes')
