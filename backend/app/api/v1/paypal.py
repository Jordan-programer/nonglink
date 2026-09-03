from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.orders import _confirm_payment
from app.core.config import settings
from app.core.database import get_db
from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User
from app.schemas.paypal import BrowserSafeClientId, CreatePayPalOrderRequest, PayPalOrderResponse
from app.services import paypal as paypal_service

router = APIRouter(prefix="/paypal", tags=["paypal"])


def _get_owned_order(db: Session, order_id: int, user_id: int) -> Order:
    order = db.query(Order).get(order_id)
    if not order or order.buyer_id != user_id:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/browser-safe-client-id", response_model=BrowserSafeClientId)
def browser_safe_client_id():
    return BrowserSafeClientId(
        client_id=settings.PAYPAL_CLIENT_ID,
        sdk_url=paypal_service.sdk_url(),
        environment=settings.PAYPAL_MODE,
    )


@router.post("/orders", response_model=PayPalOrderResponse)
def create_paypal_order(
    payload: CreatePayPalOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = _get_owned_order(db, payload.order_id, current_user.id)
    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    try:
        paypal_order = paypal_service.create_order(order.total_amount, custom_id=str(order.id))
    except paypal_service.PayPalError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    order.paypal_order_id = paypal_order["id"]
    db.commit()
    return PayPalOrderResponse(id=paypal_order["id"], status=paypal_order.get("status", ""))


@router.post("/orders/{paypal_order_id}/capture", response_model=PayPalOrderResponse)
def capture_paypal_order(
    paypal_order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.paypal_order_id == paypal_order_id, Order.buyer_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    try:
        capture = paypal_service.capture_order(paypal_order_id)
    except paypal_service.PayPalError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    capture_status = capture.get("status", "")
    if capture_status == "COMPLETED":
        try:
            order.paypal_capture_id = (
                capture["purchase_units"][0]["payments"]["captures"][0]["id"]
            )
        except (KeyError, IndexError):
            pass
        newly_confirmed = order.status == OrderStatus.PENDING
        if newly_confirmed:
            order.status = OrderStatus.CONFIRMED
        else:
            order.payment_status = PaymentStatus.PAID
    else:
        order.payment_status = PaymentStatus.FAILED
        newly_confirmed = False

    db.commit()

    if newly_confirmed:
        _confirm_payment(db, order)

    return PayPalOrderResponse(id=paypal_order_id, status=capture_status)
