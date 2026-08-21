from pydantic import BaseModel

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    identifier: str  # email or phone number
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class VerifyEmailRequest(BaseModel):
    token: str
