from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from app.models.order import Order

LEFT = 2 * cm
RIGHT = 19 * cm


def generate_invoice_pdf(order: Order) -> bytes:
    """Renders an itemized invoice for a paid order: header, buyer info,
    a product line-item table, the delivery fee (or a self-pickup note),
    and the total — mirroring what checkout charged."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(LEFT, height - 3 * cm, "AgriLink")

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(LEFT, height - 4 * cm, f"Fatura — Encomenda #{order.id}")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(LEFT, height - 4.8 * cm, f"Data: {order.created_at.strftime('%d/%m/%Y')}")
    pdf.drawString(LEFT, height - 5.4 * cm, f"Comprador: {order.buyer_name}")
    if order.buyer_email:
        pdf.drawString(LEFT, height - 6.0 * cm, f"Email: {order.buyer_email}")

    y = height - 7.5 * cm
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(LEFT, y, "Produto")
    pdf.drawRightString(11.5 * cm, y, "Qtd")
    pdf.drawRightString(15 * cm, y, "Preço unit.")
    pdf.drawRightString(RIGHT, y, "Subtotal")
    y -= 0.4 * cm
    pdf.line(LEFT, y, RIGHT, y)
    y -= 0.6 * cm

    pdf.setFont("Helvetica", 10)
    items_total = 0.0
    for item in order.items:
        subtotal = item.quantity * item.unit_price
        items_total += subtotal
        if y < 4 * cm:
            pdf.showPage()
            y = height - 3 * cm
            pdf.setFont("Helvetica", 10)
        pdf.drawString(LEFT, y, item.product_name[:48])
        pdf.drawRightString(11.5 * cm, y, f"{item.quantity:g}")
        pdf.drawRightString(15 * cm, y, f"{item.unit_price:,.2f} Kz")
        pdf.drawRightString(RIGHT, y, f"{subtotal:,.2f} Kz")
        y -= 0.6 * cm

    y -= 0.2 * cm
    pdf.line(LEFT, y, RIGHT, y)
    y -= 0.7 * cm

    pdf.setFont("Helvetica", 10)
    pdf.drawRightString(15 * cm, y, "Subtotal produtos:")
    pdf.drawRightString(RIGHT, y, f"{items_total:,.2f} Kz")
    y -= 0.6 * cm

    if order.needs_delivery:
        pdf.drawRightString(15 * cm, y, "Taxa de entrega:")
        pdf.drawRightString(RIGHT, y, f"{(order.delivery_fee or 0):,.2f} Kz")
    else:
        pdf.drawRightString(15 * cm, y, "Entrega:")
        pdf.drawRightString(RIGHT, y, "Recolha pelo comprador")
    y -= 0.8 * cm

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawRightString(15 * cm, y, "Total:")
    pdf.drawRightString(RIGHT, y, f"{order.total_amount:,.2f} Kz")
    y -= 1.2 * cm

    pdf.setFont("Helvetica", 10)
    method_name = order.payment_method.name if order.payment_method else "-"
    pdf.drawString(LEFT, y, f"Método de pagamento: {method_name}")
    y -= 0.6 * cm
    pdf.drawString(LEFT, y, "Estado do pagamento: Pago")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
