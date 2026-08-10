"""add_superadmin_role

Adds a 'superadmin' value to the users.role ENUM. Superadmins have all admin
privileges plus the ability to manage other admins (promote/demote/delete
admin and superadmin accounts) — a regular admin cannot touch other admins.

Revision ID: b8e42e7f14b5
Revises: 5f132f009a45
Create Date: 2026-08-04 17:20:19.346910

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e42e7f14b5'
down_revision: Union[str, None] = '5f132f009a45'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','admin','superadmin') "
        "NOT NULL DEFAULT 'farmer'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE users SET role = 'admin' WHERE role = 'superadmin'"
    )
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','admin') "
        "NOT NULL DEFAULT 'farmer'"
    )
