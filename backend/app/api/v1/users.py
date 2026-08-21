from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_superadmin
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    PasswordUpdate,
    RoleUpdate,
    StatusUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.services import email as email_service
from app.utils.security import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])

ADMIN_TIER = {UserRole.ADMIN, UserRole.SUPERADMIN}


@router.post("/", response_model=UserRead)
def create_user(payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if payload.role in ADMIN_TIER:
        raise HTTPException(
            status_code=403,
            detail="Contas de admin só podem ser criadas por um superadmin",
        )

    if payload.email and db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if payload.phone and db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role=payload.role,
        region_id=payload.region_id,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.email:
        token = email_service.create_verification_token(user, db)
        background_tasks.add_task(
            email_service.send_verification_email, user.email, user.name, token
        )

    return user


@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id).all()


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] != current_user.email:
        if db.query(User).filter(User.email == updates["email"]).first():
            raise HTTPException(status_code=400, detail="Email already registered")

    if "phone" in updates and updates["phone"] != current_user.phone:
        if db.query(User).filter(User.phone == updates["phone"]).first():
            raise HTTPException(status_code=400, detail="Phone already registered")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", status_code=204)
def update_my_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Password atual incorreta")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin),
):
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserRead)
def update_user_status(
    user_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Não podes suspender a tua própria conta")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role in ADMIN_TIER and admin.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=403,
            detail="Só um superadmin pode suspender contas de admin",
        )

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    superadmin: User = Depends(require_superadmin),
):
    if user_id == superadmin.id:
        raise HTTPException(status_code=400, detail="Não podes remover a tua própria conta")

    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
