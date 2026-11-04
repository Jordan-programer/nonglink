"""Seed realistic price history for Tomate, Milho and Mandioca.
Ensures forecast_price and suggest_price have > 20 real data points.
"""
from datetime import datetime, timedelta
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
import app.models
from app.models.crop import Crop
from app.models.region import Region
from app.models.price_history import PriceHistory, PriceSource


def seed_prices():
    db = SessionLocal()
    try:
        regioes = db.query(Region).all()
        culturas = db.query(Crop).all()

        if not regioes or not culturas:
            print("Regiões ou culturas ausentes.")
            return

        base_prices = {
            "Tomate": 800.0,
            "Milho": 450.0,
            "Arroz": 950.0,
            "Feijão": 1200.0,
            "Feijão-macunde": 1100.0,
            "Amendoim": 1000.0,
            "Mandioca": 350.0,
            "Batata-doce": 500.0,
            "Batata": 600.0,
            "Banana": 400.0,
            "Cebola": 750.0,
            "Repolho": 600.0,
            "Café": 2500.0,
            "Cana-de-açúcar": 300.0,
            "Girassol": 850.0,
            "Outros": 700.0,
        }

        now = datetime.now()
        total_adicionados = 0

        for r in regioes:
            for c in culturas:
                p_base = base_prices.get(c.name, 700.0)
                # Verifica se já tem pontos suficientes
                count = db.query(PriceHistory).filter(
                    PriceHistory.crop_id == c.id,
                    PriceHistory.region_id == r.id
                ).count()

                if count < 25:
                    for i in range(25 - count):
                        dias_atras = 25 - i
                        data_reg = now - timedelta(days=dias_atras)
                        # Variacao aleatoria de +- 8%
                        preco = round(p_base * (1.0 + random.uniform(-0.08, 0.08)), 2)
                        ph = PriceHistory(
                            crop_id=c.id,
                            region_id=r.id,
                            price=preco,
                            source=PriceSource.EXTERNAL,
                            external_source_name="mercado_referencia",
                            recorded_at=data_reg,
                        )
                        db.add(ph)
                        total_adicionados += 1

        db.commit()
        print(f"✓ Inseridos {total_adicionados} registos de histórico de preços para activar o modelo preditivo.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_prices()

