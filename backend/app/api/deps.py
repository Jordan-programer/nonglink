from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    subject = decode_access_token(token)
    if subject is None:
        raise credentials_error

    try:
        user_id = int(subject)
    except ValueError:
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta conta foi suspensa",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return current_user


def require_transporter(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.TRANSPORTER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transporter access required",
        )
    return current_user


def require_importer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.IMPORTER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Importer access required",
        )
    return current_user
