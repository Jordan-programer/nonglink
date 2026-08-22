import logging
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)


def _send(to_email: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.warning(
            "SMTP não configurado — email não enviado.\nPara: %s\nAssunto: %s\n%s",
            to_email,
            subject,
            body,
        )
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    # Port 465 is implicit TLS from the first byte (needs SMTP_SSL); port 587
    # (and most others) start plaintext and upgrade via STARTTLS instead.
    if settings.SMTP_PORT == 465:
        server_cls = smtplib.SMTP_SSL
    else:
        server_cls = smtplib.SMTP

    with server_cls(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS and settings.SMTP_PORT != 465:
            server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)


def create_verification_token(user: User, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_expires_at = datetime.utcnow() + timedelta(
        hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
    )
    db.commit()
    return token


def send_verification_email(to_email: str, name: str, token: str) -> None:
    link = f"{settings.FRONTEND_BASE_URL}/verificar-email?token={token}"
    body = (
        f"Olá {name},\n\n"
        "Confirma o teu email na AgriLink clicando no link abaixo:\n"
        f"{link}\n\n"
        f"Este link expira em {settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS} horas.\n\n"
        "Se não criaste esta conta, ignora este email."
    )
    _send(to_email, "Confirma o teu email — AgriLink", body)
