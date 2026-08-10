from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    role: UserRole = UserRole.FARMER
    region_id: int | None = None


class UserCreate(UserBase):
    password: str
    region_id: int

    @model_validator(mode="after")
    def require_email_or_phone(self):
        if not self.email and not self.phone:
            raise ValueError("Indica um email ou um número de telefone")
        return self


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    region_id: int | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class RoleUpdate(BaseModel):
    role: UserRole


class StatusUpdate(BaseModel):
    is_active: bool


class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    region_id: int | None = None


class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True
