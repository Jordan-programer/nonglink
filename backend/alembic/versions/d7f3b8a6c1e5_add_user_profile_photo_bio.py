"""add_user_profile_photo_bio

Adds users.profile_photo_url and users.bio so users can personalize their
profile with a photo and a short description.

Revision ID: d7f3b8a6c1e5
Revises: c2e9a47f1d63
Create Date: 2026-08-22 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7f3b8a6c1e5'
down_revision: Union[str, None] = 'c2e9a47f1d63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('profile_photo_url', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('bio', sa.String(length=300), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'bio')
    op.drop_column('users', 'profile_photo_url')
