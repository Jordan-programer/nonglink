from sqlalchemy.orm import Session

from app.models.price_history import PriceHistory, PriceSource


def record_price(
    db: Session,
    *,
    crop_id: int,
    region_id: int | None,
    price: float,
    source: PriceSource,
    product_id: int | None = None,
    order_item_id: int | None = None,
) -> None:
    """Append a price observation to the historical series.

    region_id can be missing for farms created before region capture existed;
    skip recording rather than writing an unattributable data point.
    """
    if region_id is None:
        return

    db.add(
        PriceHistory(
            crop_id=crop_id,
            region_id=region_id,
            price=price,
            source=source,
            product_id=product_id,
            order_item_id=order_item_id,
        )
    )
