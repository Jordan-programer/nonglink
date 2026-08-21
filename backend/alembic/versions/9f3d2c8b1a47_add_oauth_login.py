"""add_oauth_login

Adds google_id/facebook_id columns to users for social login, and makes
hashed_password nullable since OAuth-only accounts never set a password.

Revision ID: 9f3d2c8b1a47
Revises: 1e8b6f3a9c2d
Create Date: 2026-08-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9f3d2c8b1a47'
down_revision: Union[str, None] = '1e8b6f3a9c2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(64), nullable=True))
    op.add_column('users', sa.Column('facebook_id', sa.String(64), nullable=True))
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
    op.create_unique_constraint('uq_users_facebook_id', 'users', ['facebook_id'])
    op.create_index('ix_users_google_id', 'users', ['google_id'])
    op.create_index('ix_users_facebook_id', 'users', ['facebook_id'])
    op.alter_column('users', 'hashed_password', existing_type=sa.String(255), nullable=True)


def downgrade() -> None:
    op.alter_column('users', 'hashed_password', existing_type=sa.String(255), nullable=False)
    op.drop_index('ix_users_facebook_id', table_name='users')
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_constraint('uq_users_facebook_id', 'users', type_='unique')
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    op.drop_column('users', 'facebook_id')
    op.drop_column('users', 'google_id')
