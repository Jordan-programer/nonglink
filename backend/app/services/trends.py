from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Query


def daily_series(query: Query, date_column, value_column=None, days: int = 30) -> list[dict]:
    """Group an already-filtered/joined query by day for the last `days`
    days, real data only. Days with no matching rows are zero-filled (not
    omitted) so charts don't have gaps — callers decide whether the
    resulting series has enough real signal to show as a trend.

    `value_column`: sums this column/expression per day. Omit to count rows.
    """
    start = date.today() - timedelta(days=days - 1)
    day_expr = func.date(date_column)
    agg = func.sum(value_column) if value_column is not None else func.count()

    rows = (
        query.with_entities(day_expr.label("day"), agg.label("value"))
        .filter(date_column >= start)
        .group_by(day_expr)
        .all()
    )
    by_day = {row.day: float(row.value or 0) for row in rows}

    return [
        {
            "day": (start + timedelta(days=i)).isoformat(),
            "value": by_day.get(start + timedelta(days=i), 0.0),
        }
        for i in range(days)
    ]
