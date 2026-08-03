from fastapi import APIRouter

from app.api.v1 import auth, users, products, orders, sensors, farms

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(farms.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(sensors.router)
