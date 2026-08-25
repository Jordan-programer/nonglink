"""add_export_bridge_module

Adds the Phase 1 "Macau Bridge" B2B export module: a new IMPORTER role for
verified Chinese buyers, an importer_profiles side-table for their company
data, and export_batches/export_batch_items to aggregate multiple farmers'
stock of a crop into an exportable, certifiable batch.

Revision ID: f3c8a19d6b42
Revises: e91a4c7d3f28
Create Date: 2026-08-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3c8a19d6b42'
down_revision: Union[str, None] = 'e91a4c7d3f28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','transporter','importer','admin','superadmin') "
        "NOT NULL DEFAULT 'farmer'"
    )

    op.create_table(
        'importer_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_name', sa.String(150), nullable=False),
        sa.Column(
            'verification_status',
            sa.Enum('pending', 'verified', 'rejected', name='importerverificationstatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('macau_registered', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'export_batches',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('crop_id', sa.Integer(), nullable=False),
        sa.Column('origin_country_id', sa.Integer(), nullable=False),
        sa.Column('destination_country_id', sa.Integer(), nullable=False),
        sa.Column('min_volume_target', sa.Float(), nullable=False),
        sa.Column('total_volume', sa.Float(), nullable=False, server_default='0'),
        sa.Column(
            'status',
            sa.Enum('collecting', 'certified', 'claimed', name='exportbatchstatus'),
            nullable=False,
            server_default='collecting',
        ),
        sa.Column('certification_document_url', sa.String(255), nullable=True),
        sa.Column('certification_hash', sa.String(64), nullable=True),
        sa.Column('contract_document_url', sa.String(255), nullable=True),
        sa.Column('contract_hash', sa.String(64), nullable=True),
        sa.Column('claimed_by_id', sa.Integer(), nullable=True),
        sa.Column('claimed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['crop_id'], ['crops.id']),
        sa.ForeignKeyConstraint(['origin_country_id'], ['countries.id']),
        sa.ForeignKeyConstraint(['destination_country_id'], ['countries.id']),
        sa.ForeignKeyConstraint(['claimed_by_id'], ['users.id']),
    )

    op.create_table(
        'export_batch_items',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('batch_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['batch_id'], ['export_batches.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id']),
    )


def downgrade() -> None:
    op.drop_table('export_batch_items')
    op.drop_table('export_batches')
    op.drop_table('importer_profiles')
    op.execute(
        "UPDATE users SET role = 'buyer' WHERE role = 'importer'"
    )
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('farmer','buyer','distributor','transporter','admin','superadmin') "
        "NOT NULL DEFAULT 'farmer'"
    )
