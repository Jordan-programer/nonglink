from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
    read_at: datetime | None

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    recipient_id: int
    product_id: int | None = None
    message: str


class ConversationRead(BaseModel):
    id: int
    other_user_id: int
    other_user_name: str
    product_id: int | None
    product_name: str | None
    last_message: str | None
    last_message_at: datetime | None
    unread_count: int
    updated_at: datetime


class ConversationDetail(ConversationRead):
    messages: list[MessageRead]
