from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    conversations,
    countries,
    crops,
    export,
    farms,
    harvests,
    market,
    orders,
    payment_methods,
    paypal,
    products,
    regions,
    sensors,
    soil,
    transport,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(farms.router)
api_router.include_router(products.router)
api_router.include_router(orders.router)
api_router.include_router(sensors.router)
api_router.include_router(soil.router)
api_router.include_router(admin.router)
api_router.include_router(countries.router)
api_router.include_router(regions.router)
api_router.include_router(crops.router)
api_router.include_router(harvests.router)
api_router.include_router(market.router)
api_router.include_router(conversations.router)
api_router.include_router(transport.router)
api_router.include_router(payment_methods.router)
api_router.include_router(paypal.router)
api_router.include_router(export.router)
