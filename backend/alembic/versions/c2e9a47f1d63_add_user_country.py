"""add_user_country

Adds users.country_id so a superadmin can create one admin per country
(admins are scoped to a country, unlike farmer/buyer/distributor/transporter
accounts which use region_id instead).

Revision ID: c2e9a47f1d63
Revises: b6a1f4d92c8e
Create Date: 2026-08-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2e9a47f1d63'
down_revision: Union[str, None] = 'b6a1f4d92c8e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('country_id', sa.Integer(), nullable=True))
    op.create_index('ix_users_country_id', 'users', ['country_id'])
    op.create_foreign_key(
        'fk_users_country_id_countries',
        'users',
        'countries',
        ['country_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_users_country_id_countries', 'users', type_='foreignkey')
    op.drop_index('ix_users_country_id', table_name='users')
    op.drop_column('users', 'country_id')
