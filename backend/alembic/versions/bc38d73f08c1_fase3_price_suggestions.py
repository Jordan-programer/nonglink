"""fase3_price_suggestions

Adds declared quality/certification to products (used as price-suggestion
factors) and a price_suggestions log table — every suggestion generated is
recorded, along with whether the farmer accepted it or adjusted it, so the
business rules can be refined later from real feedback.

Revision ID: bc38d73f08c1
Revises: d816ca89ddc5
Create Date: 2026-08-05 16:11:25.298940

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc38d73f08c1'
down_revision: Union[str, None] = 'd816ca89ddc5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("quality", sa.Enum("A", "B", "C", name="productquality"), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column(
            "certification",
            sa.Enum("none", "organic", "in_transition", name="productcertification"),
            nullable=False,
            server_default="none",
        ),
    )

    op.create_table(
        "price_suggestions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=True),
        sa.Column("crop_id", sa.Integer(), sa.ForeignKey("crops.id"), nullable=False),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("regions.id"), nullable=False),
        sa.Column("quality", sa.Enum("A", "B", "C", name="productquality"), nullable=True),
        sa.Column(
            "certification",
            sa.Enum("none", "organic", "in_transition", name="productcertification"),
            nullable=True,
        ),
        sa.Column("base_price", sa.Float(), nullable=False),
        sa.Column("suggested_price", sa.Float(), nullable=False),
        sa.Column("range_low", sa.Float(), nullable=False),
        sa.Column("range_high", sa.Float(), nullable=False),
        sa.Column(
            "confidence",
            sa.Enum("alta", "media", "baixa", name="suggestionconfidence"),
            nullable=False,
        ),
        sa.Column("factors", sa.JSON(), nullable=False),
        sa.Column("price_forecast_status", sa.String(30), nullable=False),
        sa.Column("demand_forecast_status", sa.String(30), nullable=False),
        sa.Column("final_price", sa.Float(), nullable=True),
        sa.Column(
            "farmer_action",
            sa.Enum("pending", "accepted", "adjusted", name="farmeraction"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("price_suggestions")
    op.drop_column("products", "certification")
    op.drop_column("products", "quality")
