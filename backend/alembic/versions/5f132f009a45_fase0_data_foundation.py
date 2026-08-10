"""fase0_data_foundation

Adds the Fase 0 data foundation: regions (Angola provinces), crops (structured
taxonomy replacing free-text Product.category), harvests ("safras"), and
price_history (captured on every listing and sale). Also adds region_id to
users/farms and crop_id to products, with data backfill for existing rows so
the NOT NULL constraint on products.crop_id can be applied safely.

Revision ID: 5f132f009a45
Revises: 7666dc1c0f30
Create Date: 2026-08-04 15:41:15.650080

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f132f009a45'
down_revision: Union[str, None] = '7666dc1c0f30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


REGIONS = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire",
]

CROPS = [
    ("Milho", "cereais", "kg"),
    ("Arroz", "cereais", "kg"),
    ("Feijão", "leguminosas", "kg"),
    ("Feijão-macunde", "leguminosas", "kg"),
    ("Amendoim", "leguminosas", "kg"),
    ("Mandioca", "tuberculos", "kg"),
    ("Batata-doce", "tuberculos", "kg"),
    ("Banana", "frutas", "kg"),
    ("Tomate", "hortalicas", "kg"),
    ("Cebola", "hortalicas", "kg"),
    ("Repolho", "hortalicas", "kg"),
    ("Café", "outros", "kg"),
    ("Cana-de-açúcar", "outros", "kg"),
    ("Girassol", "outros", "kg"),
    ("Outros", "outros", "kg"),
]

# Existing product rows (name -> crop name) that need crop_id backfilled.
PRODUCT_NAME_TO_CROP = {
    "Milho": "Milho",
    "Feijão": "Feijão",
    "Tomate": "Tomate",
    "Batata Doce": "Batata-doce",
}


def upgrade() -> None:
    op.create_table(
        "regions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_table(
        "crops",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column(
            "category",
            sa.Enum(
                "cereais", "leguminosas", "tuberculos", "frutas", "hortalicas", "outros",
                name="cropcategory",
            ),
            nullable=False,
        ),
        sa.Column("default_unit", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_table(
        "harvests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("farm_id", sa.Integer(), sa.ForeignKey("farms.id"), nullable=False),
        sa.Column("crop_id", sa.Integer(), sa.ForeignKey("crops.id"), nullable=False),
        sa.Column("planted_at", sa.Date(), nullable=False),
        sa.Column("expected_harvest_at", sa.Date(), nullable=False),
        sa.Column("actual_harvest_at", sa.Date(), nullable=True),
        sa.Column("expected_quantity", sa.Float(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("planted", "growing", "harvested", "cancelled", name="harveststatus"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_table(
        "price_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("crop_id", sa.Integer(), sa.ForeignKey("crops.id"), nullable=False),
        sa.Column("region_id", sa.Integer(), sa.ForeignKey("regions.id"), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column(
            "source", sa.Enum("listing", "sale", "external", name="pricesource"), nullable=False
        ),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=True),
        sa.Column(
            "order_item_id", sa.Integer(), sa.ForeignKey("order_items.id"), nullable=True
        ),
        sa.Column("external_source_name", sa.String(50), nullable=True),
        sa.Column("recorded_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )

    regions_table = sa.table("regions", sa.column("name", sa.String))
    op.bulk_insert(regions_table, [{"name": name} for name in REGIONS])

    crops_table = sa.table(
        "crops",
        sa.column("name", sa.String),
        sa.column("category", sa.String),
        sa.column("default_unit", sa.String),
    )
    op.bulk_insert(
        crops_table,
        [{"name": name, "category": category, "default_unit": unit} for name, category, unit in CROPS],
    )

    # --- users.region_id ---
    op.add_column("users", sa.Column("region_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_region_id", "users", "regions", ["region_id"], ["id"]
    )

    # --- farms.region_id, backfilled from free-text location where it names a province ---
    op.add_column("farms", sa.Column("region_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_farms_region_id", "farms", "regions", ["region_id"], ["id"]
    )
    op.execute(
        """
        UPDATE farms f
        JOIN regions r ON f.location LIKE CONCAT('%', r.name, '%')
        SET f.region_id = r.id
        WHERE f.region_id IS NULL
        """
    )

    # --- products.crop_id, backfilled from existing product name/category, then NOT NULL ---
    op.add_column("products", sa.Column("crop_id", sa.Integer(), nullable=True))

    for product_name, crop_name in PRODUCT_NAME_TO_CROP.items():
        op.execute(
            sa.text(
                """
                UPDATE products
                SET crop_id = (SELECT id FROM crops WHERE name = :crop_name)
                WHERE name = :product_name AND crop_id IS NULL
                """
            ).bindparams(crop_name=crop_name, product_name=product_name)
        )
    # Anything unmapped falls back to the generic "Outros" crop rather than
    # blocking the migration — better than losing the listing's price history.
    op.execute(
        """
        UPDATE products
        SET crop_id = (SELECT id FROM crops WHERE name = 'Outros')
        WHERE crop_id IS NULL
        """
    )

    op.alter_column("products", "crop_id", existing_type=sa.Integer(), nullable=False)
    op.create_foreign_key(
        "fk_products_crop_id", "products", "crops", ["crop_id"], ["id"]
    )
    op.drop_column("products", "category")


def downgrade() -> None:
    op.add_column("products", sa.Column("category", sa.String(100), nullable=True))
    op.drop_constraint("fk_products_crop_id", "products", type_="foreignkey")
    op.drop_column("products", "crop_id")

    op.drop_constraint("fk_farms_region_id", "farms", type_="foreignkey")
    op.drop_column("farms", "region_id")

    op.drop_constraint("fk_users_region_id", "users", type_="foreignkey")
    op.drop_column("users", "region_id")

    op.drop_table("price_history")
    op.drop_table("harvests")
    op.drop_table("crops")
    op.drop_table("regions")
