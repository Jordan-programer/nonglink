from pydantic import BaseModel


class UsersByRole(BaseModel):
    farmer: int = 0
    buyer: int = 0
    distributor: int = 0
    transporter: int = 0
    admin: int = 0
    superadmin: int = 0


class AdminStats(BaseModel):
    total_users: int
    users_by_role: UsersByRole
    total_farms: int
    total_products: int
    total_orders: int
    pending_orders: int
    total_revenue: float
    total_harvests: int
    total_routes: int
    active_deliveries: int
