"""One-off import of real historical crop prices for Angola from WFP/HDX.

Source: World Food Programme "Global Food Prices Database", Angola extract,
published on the Humanitarian Data Exchange (data.humdata.org). Real market
price data, not synthetic — used to bootstrap price_history for the crop/
region pairs it covers (Luanda and Lunda Norte only; data runs 2008-2020).

Run manually, once (or after re-downloading a refreshed CSV):
    cd backend && ../.venv/Scripts/python scripts/import_external_prices.py

Idempotent: clears previously imported "wfp_hdx" rows before re-inserting,
so re-running with an updated CSV doesn't duplicate history.
"""
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.crop import Crop
from app.models.price_history import PriceHistory, PriceSource
from app.models.region import Region

CSV_PATH = Path(__file__).resolve().parent.parent.parent / "database" / "external" / "wfp_food_prices_ago.csv"
SOURCE_NAME = "wfp_hdx"

# WFP commodity -> our crop taxonomy. Commodities with no AgriLink crop
# equivalent (bread, milk, oil, salt, sugar, fish) are intentionally skipped.
COMMODITY_TO_CROP = {
    "Maize flour": "Milho",
    "Maize meal (yellow)": "Milho",
    "Beans (kidney, pinto)": "Feijão",
    "Cowpeas": "Feijão-macunde",
    "Rice (regular, milled)": "Arroz",
    "Rice (white, imported)": "Arroz",
    "Cassava flour": "Mandioca",
}


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"CSV not found at {CSV_PATH}")

    db = SessionLocal()
    try:
        crops_by_name = {c.name: c.id for c in db.query(Crop).all()}
        regions_by_name = {r.name: r.id for r in db.query(Region).all()}

        missing_crops = set(COMMODITY_TO_CROP.values()) - set(crops_by_name)
        if missing_crops:
            raise SystemExit(
                f"Crops not seeded yet, run migrations/seed first: {missing_crops}"
            )

        deleted = (
            db.query(PriceHistory)
            .filter(PriceHistory.external_source_name == SOURCE_NAME)
            .delete()
        )
        if deleted:
            print(f"Removed {deleted} previously imported rows before re-import.")

        inserted = 0
        skipped_commodity = 0
        skipped_region = 0

        with open(CSV_PATH, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                crop_name = COMMODITY_TO_CROP.get(row["commodity"])
                if crop_name is None:
                    skipped_commodity += 1
                    continue

                region_id = regions_by_name.get(row["admin1"])
                if region_id is None:
                    skipped_region += 1
                    continue

                db.add(
                    PriceHistory(
                        crop_id=crops_by_name[crop_name],
                        region_id=region_id,
                        price=float(row["price"]),
                        source=PriceSource.EXTERNAL,
                        external_source_name=SOURCE_NAME,
                        recorded_at=row["date"],
                    )
                )
                inserted += 1

        db.commit()
        print(
            f"Imported {inserted} real price observations "
            f"(skipped {skipped_commodity} unmapped commodities, "
            f"{skipped_region} unmapped regions)."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
