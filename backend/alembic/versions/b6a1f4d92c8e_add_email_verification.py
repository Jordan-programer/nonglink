"""add_email_verification

Adds email verification to users: an email_verified flag plus a single-use
token + expiry used for the verification link. Existing accounts are
grandfathered in as verified (server_default true) since they were already
active/trusted before this feature existed — verification only applies to
new email/password signups going forward. OAuth (Google/Facebook) signups
are also marked verified immediately, since the provider already confirmed
the email.

Revision ID: b6a1f4d92c8e
Revises: 9f3d2c8b1a47
Create Date: 2026-08-21 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6a1f4d92c8e'
down_revision: Union[str, None] = '9f3d2c8b1a47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        'users',
        sa.Column('email_verification_token', sa.String(length=64), nullable=True),
    )
    op.add_column(
        'users',
        sa.Column('email_verification_expires_at', sa.DateTime(), nullable=True),
    )
    op.create_index(
        'ix_users_email_verification_token',
        'users',
        ['email_verification_token'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('ix_users_email_verification_token', table_name='users')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'email_verified')
