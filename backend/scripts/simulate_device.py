"""SIMULATED DEVICE — for testing only, no real hardware involved.

Publishes periodic readings over MQTT as a real ESP32 sensor would, so the
broker -> listener -> DB pipeline can be verified end-to-end without
physical hardware. Values do a small random walk around a base so the
data looks like a real slowly-changing sensor rather than noise.

Usage:
    python scripts/simulate_device.py --sensor-id 1 --device-key <key> \
        --type soil_moisture --base 45 --count 5 --interval 2
"""
import argparse
import json
import random
import sys
import time

import paho.mqtt.client as mqtt

BROKER_HOST = "127.0.0.1"
BROKER_PORT = 1883

BASE_BY_TYPE = {
    "soil_moisture": 45.0,
    "temperature": 24.0,
    "humidity": 55.0,
    "water_level": 60.0,
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sensor-id", type=int, required=True)
    parser.add_argument("--device-key", type=str, required=True)
    parser.add_argument("--type", type=str, choices=BASE_BY_TYPE.keys(), default="soil_moisture")
    parser.add_argument("--base", type=float, default=None, help="override the base reading value")
    parser.add_argument("--count", type=int, default=5, help="number of readings to publish")
    parser.add_argument("--interval", type=float, default=2.0, help="seconds between readings")
    parser.add_argument("--bad-key", action="store_true", help="publish with a deliberately wrong device_key (for testing rejection)")
    args = parser.parse_args()

    value = args.base if args.base is not None else BASE_BY_TYPE[args.type]
    topic = f"agrilink/sensors/{args.sensor_id}/readings"
    device_key = "wrong-key-for-testing" if args.bad_key else args.device_key

    print(f"[SIMULATED DEVICE] sensor_id={args.sensor_id} type={args.type} -> {topic}")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(BROKER_HOST, BROKER_PORT)
    client.loop_start()

    try:
        for i in range(args.count):
            value = max(0.0, value + random.uniform(-2.0, 2.0))
            payload = json.dumps({"device_key": device_key, "value": round(value, 2)})
            client.publish(topic, payload, qos=1)
            print(f"[SIMULATED DEVICE] published #{i + 1}: {payload}")
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    sys.exit(main())
