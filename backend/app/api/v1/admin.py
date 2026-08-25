from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_admin, require_superadmin
from app.core.database import get_db
from app.models.country import Country
from app.models.farm import Farm
from app.models.harvest import Harvest
from app.models.importer_profile import ImporterProfile
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.transport_route import TransportRoute
from app.models.user import User, UserRole
from app.schemas.admin import AdminStats, UsersByRole
from app.schemas.export import ImporterCreate, ImporterProfileRead, ImporterVerifyRequest
from app.schemas.trends import AdminTrends
from app.schemas.user import AdminCreate, UserRead
from app.services.trends import daily_series
from app.utils.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/users", response_model=UserRead)
def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if not db.query(Country).filter(Country.id == payload.country_id).first():
        raise HTTPException(status_code=404, detail="País não encontrado")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role=UserRole.ADMIN,
        country_id=payload.country_id,
        email_verified=True,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/importers", response_model=ImporterProfileRead)
def create_importer(
    payload: ImporterCreate,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        role=UserRole.IMPORTER,
        email_verified=True,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.flush()

    profile = ImporterProfile(
        user_id=user.id,
        company_name=payload.company_name,
        macau_registered=payload.macau_registered,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/importers/{user_id}/verify", response_model=ImporterProfileRead)
def verify_importer(
    user_id: int,
    payload: ImporterVerifyRequest,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin),
):
    profile = db.query(ImporterProfile).filter(ImporterProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Importador não encontrado")

    profile.verification_status = payload.verification_status
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/stats", response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    role_counts = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )

    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar()

    return AdminStats(
        total_users=sum(role_counts.values()),
        users_by_role=UsersByRole(
            farmer=role_counts.get(UserRole.FARMER, 0),
            buyer=role_counts.get(UserRole.BUYER, 0),
            distributor=role_counts.get(UserRole.DISTRIBUTOR, 0),
            transporter=role_counts.get(UserRole.TRANSPORTER, 0),
            admin=role_counts.get(UserRole.ADMIN, 0),
            superadmin=role_counts.get(UserRole.SUPERADMIN, 0),
        ),
        total_farms=db.query(func.count(Farm.id)).scalar(),
        total_products=db.query(func.count(Product.id)).scalar(),
        total_orders=db.query(func.count(Order.id)).scalar(),
        pending_orders=db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.PENDING)
        .scalar(),
        total_revenue=float(total_revenue),
        total_harvests=db.query(func.count(Harvest.id)).scalar(),
        total_routes=db.query(func.count(TransportRoute.id)).scalar(),
        active_deliveries=db.query(func.count(Order.id))
        .filter(
            Order.transporter_id.isnot(None),
            Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.SHIPPED]),
        )
        .scalar(),
    )


@router.get("/stats/trends", response_model=AdminTrends)
def get_stats_trends(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return AdminTrends(
        new_users=daily_series(db.query(User), User.created_at),
        revenue=daily_series(db.query(Order), Order.created_at, Order.total_amount),
        new_orders=daily_series(db.query(Order), Order.created_at),
    )
