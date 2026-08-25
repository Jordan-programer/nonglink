import hashlib
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas


def generate_pdf(title: str, fields: dict[str, str]) -> bytes:
    """Render a simple title + key/value document. Used for both the batch
    certification and the claim contract — same layout, different fields."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(2 * cm, height - 3 * cm, "AgriLink")

    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(2 * cm, height - 4 * cm, title)

    pdf.setFont("Helvetica", 11)
    y = height - 5.5 * cm
    for label, value in fields.items():
        pdf.drawString(2 * cm, y, f"{label}: {value}")
        y -= 0.8 * cm

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
