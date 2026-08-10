"""MQTT broker + listener for AgriLink sensors.

Runs an `amqtt` broker (a real, pip-installable MQTT 3.1.1 broker — used
instead of a system-level Mosquitto install so this runs without an
installer or admin rights) and, in the same asyncio process, a subscriber
that consumes readings and persists them.

Devices publish JSON to `agrilink/sensors/{sensor_id}/readings`:
    {"device_key": "<sensor's secret key>", "value": <float>}

Messages from an unknown sensor_id or with the wrong device_key are
dropped (logged, not persisted) — the basic "don't accept data from
unregistered devices" security the plan calls for.

Run: cd backend && ../.venv/Scripts/python scripts/mqtt_service.py
Stop: Ctrl+C
"""
import asyncio
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from amqtt.broker import Broker
from amqtt.client import MQTTClient
from amqtt.mqtt.constants import QOS_1

from app.core.database import SessionLocal
from app.services.sensor_ingest import authenticate_device, record_reading

TOPIC = "agrilink/sensors/+/readings"
BROKER_URI = "mqtt://127.0.0.1:1883"

logger = logging.getLogger("agrilink.mqtt")


async def _handle_messages(client: MQTTClient) -> None:
    while True:
        message = await client.deliver_message()
        if message is None:
            continue

        parts = message.topic.split("/")
        if len(parts) != 4 or not parts[2].isdigit():
            logger.warning("ignoring message on unexpected topic %s", message.topic)
            continue
        sensor_id = int(parts[2])

        try:
            payload = json.loads(message.data)
            device_key = str(payload["device_key"])
            value = float(payload["value"])
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            logger.warning("malformed payload on %s: %r", message.topic, message.data)
            continue

        db = SessionLocal()
        try:
            sensor = authenticate_device(db, sensor_id=sensor_id, device_key=device_key)
            if not sensor:
                logger.warning("rejected reading from unknown/unauthorized sensor_id=%s", sensor_id)
                continue
            record_reading(db, sensor=sensor, value=value)
            logger.info("recorded reading sensor_id=%s value=%s", sensor_id, value)
        finally:
            db.close()


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

    broker = Broker()
    await broker.start()
    logger.info("MQTT broker listening on 0.0.0.0:1883")

    client = MQTTClient()
    await client.connect(BROKER_URI)
    await client.subscribe([(TOPIC, QOS_1)])
    logger.info("Listener subscribed to %s", TOPIC)

    try:
        await _handle_messages(client)
    finally:
        await client.disconnect()
        await broker.shutdown()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
