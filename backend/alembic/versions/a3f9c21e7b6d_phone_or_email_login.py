"""phone_or_email_login

Makes users.email optional and users.phone unique, so an account can be
created and logged into with either identifier — needed for farmers who
have a phone but no email address.

Revision ID: a3f9c21e7b6d
Revises: 11cee4ddc11d
Create Date: 2026-08-05 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f9c21e7b6d'
down_revision: Union[str, None] = '11cee4ddc11d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'email', existing_type=sa.String(190), nullable=True)
    op.create_unique_constraint('uq_users_phone', 'users', ['phone'])


def downgrade() -> None:
    op.drop_constraint('uq_users_phone', 'users', type_='unique')
    op.alter_column('users', 'email', existing_type=sa.String(190), nullable=False)
