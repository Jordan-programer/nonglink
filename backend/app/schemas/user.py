from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole = UserRole.FARMER


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True
