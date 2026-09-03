from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus
from app.models.region import Region
from app.models.transporter_profile import TransporterProfile, TransporterVerificationStatus
from app.models.user import User
from app.services.geo import haversine_km

ACTIVE_DELIVERY_STATUSES = {
    OrderStatus.CONFIRMED,
    OrderStatus.COLLECTED,
    OrderStatus.SHIPPED,
}


def _transporter_position(db: Session, profile: TransporterProfile) -> tuple[float, float] | None:
    if profile.current_latitude is not None and profile.current_longitude is not None:
        return (profile.current_latitude, profile.current_longitude)

    user = db.query(User).filter(User.id == profile.user_id).first()
    if user and user.region_id:
        region = db.query(Region).filter(Region.id == user.region_id).first()
        if region and region.latitude is not None and region.longitude is not None:
            return (region.latitude, region.longitude)
    return None


def find_nearest_available_transporter(
    db: Session, pickup_lat: float, pickup_lon: float
) -> User | None:
    """Straight-line nearest verified, available, not-currently-busy
    transporter to the first pickup point. Returns None if none qualify —
    the order then falls back to the existing manual claim pool."""
    busy_transporter_ids = {
        row[0]
        for row in db.query(Order.transporter_id)
        .filter(
            Order.transporter_id.isnot(None),
            Order.status.in_(ACTIVE_DELIVERY_STATUSES),
        )
        .all()
    }

    candidates = (
        db.query(TransporterProfile)
        .filter(
            TransporterProfile.verification_status == TransporterVerificationStatus.APPROVED,
            TransporterProfile.is_available.is_(True),
        )
        .all()
    )

    best_user: User | None = None
    best_distance: float | None = None
    for profile in candidates:
        if profile.user_id in busy_transporter_ids:
            continue
        position = _transporter_position(db, profile)
        if position is None:
            continue
        distance = haversine_km(pickup_lat, pickup_lon, position[0], position[1])
        if best_distance is None or distance < best_distance:
            best_distance = distance
            best_user = db.query(User).filter(User.id == profile.user_id).first()

    return best_user
