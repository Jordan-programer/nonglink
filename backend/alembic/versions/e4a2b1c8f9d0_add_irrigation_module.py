"""add_irrigation_module

Adds the Phase 2A irrigation scheduling module: irrigations table for tracking
scheduled, completed, and cancelled farm irrigation events with duration and notes.

Revision ID: e4a2b1c8f9d0
Revises: c4a9e1f6b8d2
Create Date: 2026-10-30 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4a2b1c8f9d0'
down_revision: Union[str, None] = 'c4a9e1f6b8d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'irrigations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('farm_id', sa.Integer(), nullable=False),
        sa.Column('scheduled_time', sa.DateTime(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column(
            'status',
            sa.Enum('agendada', 'concluida', 'cancelada', name='irrigationstatus'),
            server_default='agendada',
            nullable=False,
        ),
        sa.Column('criada_via', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['farm_id'], ['farms.id'], ondelete='CASCADE'),
        sa.CheckConstraint(
            'duration_minutes >= 1 AND duration_minutes <= 600',
            name='check_duration_minutes_range',
        ),
    )
    op.create_index(op.f('ix_irrigations_id'), 'irrigations', ['id'], unique=False)
    op.create_index(op.f('ix_irrigations_farm_id'), 'irrigations', ['farm_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_irrigations_farm_id'), table_name='irrigations')
    op.drop_index(op.f('ix_irrigations_id'), table_name='irrigations')
    op.drop_table('irrigations')
