import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"
PRODUCTS_DIR = UPLOAD_ROOT / "products"
PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


async def save_product_image(file: UploadFile) -> str:
    """Validate and persist an uploaded product photo to local disk, returning
    the public URL path to store on the product. Local disk is enough for
    this single-server deployment; swap for object storage if that changes."""
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="A imagem deve ser JPEG, PNG ou WEBP")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="A imagem não pode exceder 5MB")

    filename = f"{uuid.uuid4().hex}.{ext}"
    (PRODUCTS_DIR / filename).write_bytes(contents)

    return f"/uploads/products/{filename}"
