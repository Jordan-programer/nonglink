from datetime import datetime, timedelta, timezone

import pytest
from app.models.irrigation import Irrigation, IrrigationStatus


def test_unauthenticated_requests_return_401(client, owner_farm):
    farm_id = owner_farm.id

    # POST without token
    resp = client.post(
        f"/api/v1/farms/{farm_id}/irrigations",
        json={
            "scheduled_time": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
            "duration_minutes": 60,
        },
    )
    assert resp.status_code == 401

    # GET without token
    resp = client.get("/api/v1/irrigations/mine")
    assert resp.status_code == 401

    # PATCH without token
    resp = client.patch("/api/v1/irrigations/1/cancel")
    assert resp.status_code == 401


def test_create_irrigation_owner_success(client, owner_headers, owner_farm):
    future_time = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    payload = {
        "scheduled_time": future_time,
        "duration_minutes": 45,
        "notes": "Rega no setor norte",
        "criada_via": "web",
    }
    resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json=payload,
        headers=owner_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["farm_id"] == owner_farm.id
    assert data["duration_minutes"] == 45
    assert data["notes"] == "Rega no setor norte"
    assert data["status"] == "agendada"
    assert data["criada_via"] == "web"
    assert "id" in data
    assert "created_at" in data


def test_non_owner_cannot_access_or_alter_farm_irrigations(
    client, owner_headers, other_headers, owner_farm
):
    future_time = (datetime.now(timezone.utc) + timedelta(hours=4)).isoformat()
    payload = {
        "scheduled_time": future_time,
        "duration_minutes": 30,
        "notes": "Tentativa não-autorizada",
    }

    # Non-owner tries to create irrigation on owner's farm -> 404
    resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json=payload,
        headers=other_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Farm not found"

    # Owner creates an irrigation
    create_resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json=payload,
        headers=owner_headers,
    )
    assert create_resp.status_code == 201
    irrigation_id = create_resp.json()["id"]

    # Non-owner tries to cancel owner's irrigation -> 404
    cancel_resp = client.patch(
        f"/api/v1/irrigations/{irrigation_id}/cancel",
        headers=other_headers,
    )
    assert cancel_resp.status_code == 404
    assert cancel_resp.json()["detail"] == "Irrigation not found"


def test_scheduled_time_in_past_returns_422(client, owner_headers, owner_farm):
    past_time = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()
    resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": past_time, "duration_minutes": 60},
        headers=owner_headers,
    )
    assert resp.status_code == 422


def test_scheduled_time_within_one_minute_tolerance_succeeds(
    client, owner_headers, owner_farm
):
    # 20 seconds in the past should pass due to 1 minute tolerance
    tolerated_time = (datetime.now(timezone.utc) - timedelta(seconds=20)).isoformat()
    resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": tolerated_time, "duration_minutes": 60},
        headers=owner_headers,
    )
    assert resp.status_code == 201


def test_invalid_duration_returns_422(client, owner_headers, owner_farm):
    future_time = (datetime.now(timezone.utc) + timedelta(hours=5)).isoformat()

    # Duration 0 (< 1)
    resp_zero = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": future_time, "duration_minutes": 0},
        headers=owner_headers,
    )
    assert resp_zero.status_code == 422

    # Duration 601 (> 600)
    resp_over = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": future_time, "duration_minutes": 601},
        headers=owner_headers,
    )
    assert resp_over.status_code == 422


def test_overlapping_irrigation_returns_409(
    client, owner_headers, other_headers, owner_farm, other_farm
):
    base_time = datetime.now(timezone.utc) + timedelta(hours=6)

    # 1. Create first irrigation from base_time to base_time + 60min
    resp1 = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={
            "scheduled_time": base_time.isoformat(),
            "duration_minutes": 60,
            "notes": "Rega inicial",
        },
        headers=owner_headers,
    )
    assert resp1.status_code == 201
    irr_id = resp1.json()["id"]

    # 2. Overlapping irrigation on SAME farm (base_time + 30min, duration 30min) -> 409
    resp_overlap = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={
            "scheduled_time": (base_time + timedelta(minutes=30)).isoformat(),
            "duration_minutes": 30,
        },
        headers=owner_headers,
    )
    assert resp_overlap.status_code == 409
    assert "sobrepõe-se" in resp_overlap.json()["detail"]

    # 3. Same time window on a DIFFERENT farm -> succeeds (201)
    resp_diff_farm = client.post(
        f"/api/v1/farms/{other_farm.id}/irrigations",
        json={
            "scheduled_time": (base_time + timedelta(minutes=30)).isoformat(),
            "duration_minutes": 30,
        },
        headers=other_headers,
    )
    assert resp_diff_farm.status_code == 201

    # 4. Adjacent non-overlapping on SAME farm (starts exactly at base_time + 60min) -> succeeds (201)
    resp_adjacent = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={
            "scheduled_time": (base_time + timedelta(minutes=60)).isoformat(),
            "duration_minutes": 30,
        },
        headers=owner_headers,
    )
    assert resp_adjacent.status_code == 201

    # 5. Cancel the first irrigation, then booking at base_time should now succeed
    cancel_resp = client.patch(
        f"/api/v1/irrigations/{irr_id}/cancel",
        headers=owner_headers,
    )
    assert cancel_resp.status_code == 200

    resp_rebook = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={
            "scheduled_time": base_time.isoformat(),
            "duration_minutes": 40,
        },
        headers=owner_headers,
    )
    assert resp_rebook.status_code == 201


def test_cancel_irrigation_lifecycle(client, owner_headers, owner_farm):
    future_time = (datetime.now(timezone.utc) + timedelta(hours=10)).isoformat()
    resp = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": future_time, "duration_minutes": 60},
        headers=owner_headers,
    )
    assert resp.status_code == 201
    irr_id = resp.json()["id"]

    # Cancel once -> 200
    cancel_resp = client.patch(
        f"/api/v1/irrigations/{irr_id}/cancel",
        headers=owner_headers,
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelada"

    # Cancel again -> 400 (already cancelled)
    cancel_again = client.patch(
        f"/api/v1/irrigations/{irr_id}/cancel",
        headers=owner_headers,
    )
    assert cancel_again.status_code == 400
    assert "agendada" in cancel_again.json()["detail"]


def test_list_mine_isolation_filters_and_ordering(
    client, owner_headers, other_headers, owner_farm, other_farm
):
    t0 = datetime.now(timezone.utc) + timedelta(days=1)
    t1 = t0 + timedelta(hours=2)
    t2 = t0 + timedelta(hours=5)

    # Owner creates two irrigations
    resp1 = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": t1.isoformat(), "duration_minutes": 30, "notes": "Rega 1"},
        headers=owner_headers,
    )
    resp2 = client.post(
        f"/api/v1/farms/{owner_farm.id}/irrigations",
        json={"scheduled_time": t0.isoformat(), "duration_minutes": 45, "notes": "Rega 0"},
        headers=owner_headers,
    )
    irr1_id = resp1.json()["id"]

    # Cancel resp1
    client.patch(f"/api/v1/irrigations/{irr1_id}/cancel", headers=owner_headers)

    # Other user creates an irrigation
    client.post(
        f"/api/v1/farms/{other_farm.id}/irrigations",
        json={"scheduled_time": t2.isoformat(), "duration_minutes": 60, "notes": "Outro"},
        headers=other_headers,
    )

    # 1. Isolation: owner should see only 2 irrigations, not 3
    list_resp = client.get("/api/v1/irrigations/mine", headers=owner_headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert len(data) == 2
    # Verify ordering by scheduled_time asc (t0 before t1)
    assert data[0]["notes"] == "Rega 0"
    assert data[1]["notes"] == "Rega 1"

    # 2. Filter by status
    scheduled_only = client.get(
        "/api/v1/irrigations/mine?status=agendada",
        headers=owner_headers,
    ).json()
    assert len(scheduled_only) == 1
    assert scheduled_only[0]["notes"] == "Rega 0"

    cancelled_only = client.get(
        "/api/v1/irrigations/mine?status=cancelada",
        headers=owner_headers,
    ).json()
    assert len(cancelled_only) == 1
    assert cancelled_only[0]["notes"] == "Rega 1"

    # 3. Filter by date range (from and to)
    range_resp = client.get(
        f"/api/v1/irrigations/mine?from={(t0 - timedelta(minutes=10)).isoformat()}&to={(t0 + timedelta(minutes=10)).isoformat()}",
        headers=owner_headers,
    ).json()
    assert len(range_resp) == 1
    assert range_resp[0]["notes"] == "Rega 0"
