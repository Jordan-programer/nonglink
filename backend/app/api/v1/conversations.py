from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.conversation import Conversation, Message
from app.models.product import Product
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetail,
    ConversationRead,
    MessageCreate,
    MessageRead,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _get_owned_conversation(db: Session, conversation_id: int, user_id: int) -> Conversation:
    conversation = db.query(Conversation).get(conversation_id)
    if not conversation or user_id not in (conversation.user_a_id, conversation.user_b_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


def _serialize(conv: Conversation, current_user_id: int, db: Session) -> ConversationRead:
    other = conv.other_user(current_user_id)
    last_message = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    unread_count = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.read_at.is_(None),
        )
        .count()
    )
    return ConversationRead(
        id=conv.id,
        other_user_id=other.id,
        other_user_name=other.name,
        product_id=conv.product_id,
        product_name=conv.product.name if conv.product else None,
        last_message=last_message.content if last_message else None,
        last_message_at=last_message.created_at if last_message else None,
        unread_count=unread_count,
        updated_at=conv.updated_at,
    )


def _detail(conv: Conversation, current_user_id: int, db: Session) -> ConversationDetail:
    return ConversationDetail(
        **_serialize(conv, current_user_id, db).model_dump(),
        messages=[MessageRead.model_validate(m) for m in conv.messages],
    )


@router.get("/", response_model=list[ConversationRead])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.user_a_id == current_user.id,
                Conversation.user_b_id == current_user.id,
            )
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [_serialize(c, current_user.id, db) for c in conversations]


@router.post("/", response_model=ConversationDetail)
def start_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.recipient_id == current_user.id:
        raise HTTPException(status_code=400, detail="Não podes iniciar uma conversa contigo mesmo")

    recipient = db.query(User).get(payload.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")

    if payload.product_id is not None and not db.query(Product).get(payload.product_id):
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    user_a_id, user_b_id = sorted([current_user.id, payload.recipient_id])
    conversation = (
        db.query(Conversation)
        .filter(Conversation.user_a_id == user_a_id, Conversation.user_b_id == user_b_id)
        .first()
    )
    if not conversation:
        conversation = Conversation(
            user_a_id=user_a_id, user_b_id=user_b_id, product_id=payload.product_id
        )
        db.add(conversation)
        db.flush()
    elif payload.product_id is not None and conversation.product_id is None:
        conversation.product_id = payload.product_id

    db.add(Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.message,
    ))
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)

    return _detail(conversation, current_user.id, db)


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = _get_owned_conversation(db, conversation_id, current_user.id)

    unread = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation.id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
        .all()
    )
    if unread:
        now = datetime.utcnow()
        for m in unread:
            m.read_at = now
        db.commit()
        db.refresh(conversation)

    return _detail(conversation, current_user.id, db)


@router.post("/{conversation_id}/messages", response_model=MessageRead)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = _get_owned_conversation(db, conversation_id, current_user.id)

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=payload.content,
    )
    db.add(message)
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(message)
    return message
