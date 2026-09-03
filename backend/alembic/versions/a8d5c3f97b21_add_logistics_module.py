"""add_logistics_module

Adds the Phase 1 logistics/delivery-tracking module: transporter
verification (profile + vehicle + documents), per-order delivery stops
(multi-farm pickup + dropoff, sequenced by the route-optimization
service), a new 'collected' order status between 'confirmed' and
'shipped', delivery pricing fields on orders, and a weight field on
products so distance+weight pricing can be computed.

Revision ID: a8d5c3f97b21
Revises: f3c8a19d6b42
Create Date: 2026-09-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8d5c3f97b21'
down_revision: Union[str, None] = 'f3c8a19d6b42'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE orders MODIFY COLUMN status "
        "ENUM('pending','confirmed','collected','shipped','delivered','cancelled') "
        "NOT NULL DEFAULT 'pending'"
    )
    op.add_column('orders', sa.Column('delivery_fee', sa.Float(), nullable=True))
    op.add_column('orders', sa.Column('delivery_distance_km', sa.Float(), nullable=True))

    op.add_column('products', sa.Column('weight_per_unit_kg', sa.Float(), nullable=True))

    op.create_table(
        'transporter_profiles',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column(
            'verification_status',
            sa.Enum('pending', 'approved', 'rejected', name='transporterverificationstatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('current_latitude', sa.Float(), nullable=True),
        sa.Column('current_longitude', sa.Float(), nullable=True),
        sa.Column('location_updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('user_id'),
    )

    op.create_table(
        'vehicles',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('transporter_profile_id', sa.Integer(), nullable=False),
        sa.Column('plate', sa.String(20), nullable=False),
        sa.Column('vehicle_type', sa.String(50), nullable=False),
        sa.Column('capacity_kg', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['transporter_profile_id'], ['transporter_profiles.id']),
        sa.UniqueConstraint('transporter_profile_id'),
    )

    op.create_table(
        'transporter_documents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('transporter_profile_id', sa.Integer(), nullable=False),
        sa.Column(
            'document_type',
            sa.Enum(
                'driver_license', 'vehicle_registration', 'insurance', 'inspection',
                name='transporterdocumenttype',
            ),
            nullable=False,
        ),
        sa.Column('file_url', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['transporter_profile_id'], ['transporter_profiles.id']),
    )

    op.create_table(
        'delivery_stops',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('stop_type', sa.Enum('pickup', 'dropoff', name='deliverystoptype'), nullable=False),
        sa.Column('farm_id', sa.Integer(), nullable=True),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column(
            'status',
            sa.Enum('pending', 'completed', name='deliverystopstatus'),
            nullable=False,
            server_default='pending',
        ),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id']),
    )


def downgrade() -> None:
    op.drop_table('delivery_stops')
    op.drop_table('transporter_documents')
    op.drop_table('vehicles')
    op.drop_table('transporter_profiles')

    op.drop_column('products', 'weight_per_unit_kg')

    op.drop_column('orders', 'delivery_distance_km')
    op.drop_column('orders', 'delivery_fee')
    op.execute(
        "UPDATE orders SET status = 'confirmed' WHERE status = 'collected'"
    )
    op.execute(
        "ALTER TABLE orders MODIFY COLUMN status "
        "ENUM('pending','confirmed','shipped','delivered','cancelled') "
        "NOT NULL DEFAULT 'pending'"
    )
