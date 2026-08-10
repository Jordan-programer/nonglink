"""product_image_url

Adds products.image_url so listings can show a real photo instead of the
placeholder tile in the marketplace grid.

Revision ID: c7d2e8f14a91
Revises: a3f9c21e7b6d
Create Date: 2026-08-05 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7d2e8f14a91'
down_revision: Union[str, None] = 'a3f9c21e7b6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('image_url', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('products', 'image_url')
