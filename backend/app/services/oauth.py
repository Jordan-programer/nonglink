import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User, UserRole

_google_request = google_requests.Request()


class OAuthError(Exception):
    pass


def verify_google_id_token(token: str) -> dict:
    allowed_audiences = {
        aud
        for aud in (
            settings.GOOGLE_CLIENT_ID_WEB,
            settings.GOOGLE_CLIENT_ID_ANDROID,
            settings.GOOGLE_CLIENT_ID_IOS,
        )
        if aud
    }
    if not allowed_audiences:
        raise OAuthError("O login com Google não está configurado")

    try:
        payload = google_id_token.verify_oauth2_token(token, _google_request)
    except ValueError as exc:
        raise OAuthError(f"Token do Google inválido: {exc}") from exc

    if payload.get("aud") not in allowed_audiences:
        raise OAuthError("O token do Google não foi emitido para esta app")

    email = payload.get("email")
    return {
        "provider_id": payload["sub"],
        "email": email,
        "name": payload.get("name") or (email.split("@")[0] if email else "Utilizador Google"),
    }


def exchange_facebook_code(code: str, redirect_uri: str) -> str:
    if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
        raise OAuthError("O login com Facebook não está configurado")

    try:
        resp = requests.get(
            "https://graph.facebook.com/v21.0/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_APP_ID,
                "client_secret": settings.FACEBOOK_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise OAuthError(f"Falha ao trocar o código do Facebook: {exc}") from exc

    token = resp.json().get("access_token")
    if not token:
        raise OAuthError("O Facebook não devolveu um access token")
    return token


def verify_facebook_access_token(access_token: str) -> dict:
    if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
        raise OAuthError("O login com Facebook não está configurado")

    try:
        debug_resp = requests.get(
            "https://graph.facebook.com/debug_token",
            params={
                "input_token": access_token,
                "access_token": f"{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}",
            },
            timeout=15,
        )
        debug_resp.raise_for_status()
        debug_data = debug_resp.json().get("data", {})
        if not debug_data.get("is_valid") or str(debug_data.get("app_id")) != settings.FACEBOOK_APP_ID:
            raise OAuthError("Token do Facebook inválido")

        profile_resp = requests.get(
            "https://graph.facebook.com/me",
            params={"fields": "id,name,email", "access_token": access_token},
            timeout=15,
        )
        profile_resp.raise_for_status()
    except requests.RequestException as exc:
        raise OAuthError(f"Falha ao verificar o token do Facebook: {exc}") from exc

    profile = profile_resp.json()
    return {
        "provider_id": profile["id"],
        "email": profile.get("email"),
        "name": profile.get("name") or "Utilizador Facebook",
    }


def get_or_create_oauth_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: str | None,
    name: str,
) -> User:
    id_field = f"{provider}_id"

    user = db.query(User).filter(getattr(User, id_field) == provider_id).first()
    if user:
        return user

    if email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            setattr(user, id_field, provider_id)
            db.commit()
            db.refresh(user)
            return user

    user = User(
        name=name,
        email=email,
        role=UserRole.BUYER,
        hashed_password=None,
        email_verified=bool(email),
        **{id_field: provider_id},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
