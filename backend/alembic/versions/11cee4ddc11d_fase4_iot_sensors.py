"""fase4_iot_sensors

Adds a per-device secret key to sensors (so the MQTT listener can reject
readings from unregistered/unknown devices) and a sensor_alerts log table
for threshold breaches.

Revision ID: 11cee4ddc11d
Revises: bc38d73f08c1
Create Date: 2026-08-05 17:53:24.153685

"""
import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '11cee4ddc11d'
down_revision: Union[str, None] = 'bc38d73f08c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("sensors", sa.Column("device_key", sa.String(64), nullable=True))

    conn = op.get_bind()
    sensor_ids = [row[0] for row in conn.execute(sa.text("SELECT id FROM sensors"))]
    for sensor_id in sensor_ids:
        conn.execute(
            sa.text("UPDATE sensors SET device_key = :key WHERE id = :id"),
            {"key": secrets.token_hex(24), "id": sensor_id},
        )

    op.alter_column("sensors", "device_key", existing_type=sa.String(64), nullable=False)
    op.create_unique_constraint("uq_sensors_device_key", "sensors", ["device_key"])

    op.create_table(
        "sensor_alerts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sensor_id", sa.Integer(), sa.ForeignKey("sensors.id"), nullable=False),
        sa.Column("reading_id", sa.BigInteger(), sa.ForeignKey("sensor_readings.id"), nullable=False),
        sa.Column(
            "severity", sa.Enum("critical", name="alertseverity"), nullable=False,
            server_default="critical",
        ),
        sa.Column("message", sa.String(255), nullable=False),
        sa.Column("acknowledged", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("sensor_alerts")
    op.drop_constraint("uq_sensors_device_key", "sensors", type_="unique")
    op.drop_column("sensors", "device_key")
