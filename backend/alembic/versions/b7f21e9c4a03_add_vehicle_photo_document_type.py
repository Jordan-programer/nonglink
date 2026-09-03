"""add_vehicle_photo_document_type

Adds 'vehicle_photo' to transporter_documents.document_type so
transporters can submit multiple photos of the vehicle from different
angles, alongside the existing single-slot license/registration/
insurance/inspection documents.

Revision ID: b7f21e9c4a03
Revises: a8d5c3f97b21
Create Date: 2026-09-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b7f21e9c4a03'
down_revision: Union[str, None] = 'a8d5c3f97b21'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE transporter_documents MODIFY COLUMN document_type "
        "ENUM('driver_license','vehicle_registration','insurance','inspection','vehicle_photo') "
        "NOT NULL"
    )


def downgrade() -> None:
    op.execute("DELETE FROM transporter_documents WHERE document_type = 'vehicle_photo'")
    op.execute(
        "ALTER TABLE transporter_documents MODIFY COLUMN document_type "
        "ENUM('driver_license','vehicle_registration','insurance','inspection') "
        "NOT NULL"
    )
