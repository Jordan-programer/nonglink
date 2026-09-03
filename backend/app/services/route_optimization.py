from dataclasses import dataclass
from typing import Any

from app.services.geo import haversine_km


@dataclass
class StopPoint:
    latitude: float
    longitude: float
    data: Any = None


def _tour_length(start: tuple[float, float], order: list[StopPoint], end: tuple[float, float]) -> float:
    points = [start] + [(s.latitude, s.longitude) for s in order] + [end]
    return sum(
        haversine_km(*points[i], *points[i + 1]) for i in range(len(points) - 1)
    )


def _nearest_neighbor(start: tuple[float, float], stops: list[StopPoint]) -> list[StopPoint]:
    remaining = list(stops)
    ordered: list[StopPoint] = []
    current = start
    while remaining:
        nearest = min(
            remaining,
            key=lambda s: haversine_km(current[0], current[1], s.latitude, s.longitude),
        )
        ordered.append(nearest)
        remaining.remove(nearest)
        current = (nearest.latitude, nearest.longitude)
    return ordered


def _two_opt(start: tuple[float, float], order: list[StopPoint], end: tuple[float, float]) -> list[StopPoint]:
    best = order
    best_length = _tour_length(start, best, end)
    improved = True
    while improved:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 1, len(best)):
                candidate = best[:i] + best[i : j + 1][::-1] + best[j + 1 :]
                candidate_length = _tour_length(start, candidate, end)
                if candidate_length < best_length:
                    best, best_length = candidate, candidate_length
                    improved = True
    return best


def optimize_stops(
    start: tuple[float, float],
    stops: list[StopPoint],
    fixed_end: tuple[float, float],
) -> list[StopPoint]:
    """Order `stops` (e.g. farm pickups) starting from `start` (the assigned
    transporter's current position) and always finishing at `fixed_end` (the
    buyer's delivery point, which is never reordered). Nearest-neighbor for
    an initial tour, then 2-opt to remove obvious crossings — appropriate
    for the small number of stops a single order has; not a general VRP
    solver."""
    if not stops:
        return []
    initial = _nearest_neighbor(start, stops)
    return _two_opt(start, initial, fixed_end)


def optimize_stops_open_start(
    stops: list[StopPoint], fixed_end: tuple[float, float]
) -> list[StopPoint]:
    """Same as `optimize_stops`, but for use at planning time, before a
    transporter is assigned — there's no fixed starting position yet, so
    this tries each stop as the tour's first pickup and keeps whichever
    produces the shortest total distance to `fixed_end`. Fine for the small
    stop counts a single order has; would need a smarter approach at scale."""
    if not stops:
        return []
    if len(stops) == 1:
        return list(stops)

    best_order: list[StopPoint] | None = None
    best_length: float | None = None
    for first in stops:
        rest = [s for s in stops if s is not first]
        start = (first.latitude, first.longitude)
        ordered = [first] + _two_opt(start, _nearest_neighbor(start, rest), fixed_end)
        length = _tour_length(start, ordered[1:], fixed_end)
        if best_length is None or length < best_length:
            best_length = length
            best_order = ordered

    return best_order or list(stops)
