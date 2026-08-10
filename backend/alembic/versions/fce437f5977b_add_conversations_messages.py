"""add_conversations_messages

Adds the messaging system: one conversation per pair of users (optionally
tagged with the product that started it), holding an ordered list of
messages with per-recipient read tracking.

Revision ID: fce437f5977b
Revises: c7d2e8f14a91
Create Date: 2026-08-05 22:35:49.351546

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fce437f5977b'
down_revision: Union[str, None] = 'c7d2e8f14a91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_a_id', sa.Integer(), nullable=False),
        sa.Column('user_b_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_a_id'], ['users.id']),
        sa.ForeignKeyConstraint(['user_b_id'], ['users.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.UniqueConstraint('user_a_id', 'user_b_id', name='uq_conversation_pair'),
    )

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id']),
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])


def downgrade() -> None:
    op.drop_index('ix_messages_conversation_id', table_name='messages')
    op.drop_table('messages')
    op.drop_table('conversations')
