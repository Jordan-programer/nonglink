from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, Token, VerifyEmailRequest
from app.schemas.oauth import FacebookLoginRequest, GoogleLoginRequest
from app.schemas.user import UserRead
from app.services import email as email_service
from app.services import oauth as oauth_service
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_for_oauth_user(user: User) -> Token:
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta conta foi suspensa. Contacta o suporte.",
        )
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token, user=user)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(or_(User.email == payload.identifier, User.phone == payload.identifier))
        .first()
    )
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/telefone ou password incorretos",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta conta foi suspensa. Contacta o suporte.",
        )

    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token, user=user)


@router.post("/google", response_model=Token)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        profile = oauth_service.verify_google_id_token(payload.id_token)
    except oauth_service.OAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = oauth_service.get_or_create_oauth_user(
        db, "google", profile["provider_id"], profile["email"], profile["name"]
    )
    return _token_for_oauth_user(user)


@router.post("/facebook", response_model=Token)
def login_with_facebook(payload: FacebookLoginRequest, db: Session = Depends(get_db)):
    try:
        access_token = payload.access_token or oauth_service.exchange_facebook_code(
            payload.code, payload.redirect_uri
        )
        profile = oauth_service.verify_facebook_access_token(access_token)
    except oauth_service.OAuthError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = oauth_service.get_or_create_oauth_user(
        db, "facebook", profile["provider_id"], profile["email"], profile["name"]
    )
    return _token_for_oauth_user(user)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify-email", response_model=Token)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_verification_token == payload.token).first()
    if (
        not user
        or not user.email_verification_expires_at
        or user.email_verification_expires_at < datetime.utcnow()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de verificação inválido ou expirado",
        )

    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token, user=user)


@router.post("/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
def resend_verification(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A tua conta não tem um email associado",
        )
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O teu email já está verificado",
        )

    token = email_service.create_verification_token(current_user, db)
    background_tasks.add_task(
        email_service.send_verification_email, current_user.email, current_user.name, token
    )
