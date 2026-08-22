import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

UPLOAD_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"
PRODUCTS_DIR = UPLOAD_ROOT / "products"
PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)
PROFILES_DIR = UPLOAD_ROOT / "profiles"
PROFILES_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


async def _save_image(file: UploadFile, directory: Path, url_prefix: str) -> str:
    """Validate and persist an uploaded photo to local disk, returning the
    public URL path to store on the record. Local disk is enough for this
    single-server deployment; swap for object storage if that changes."""
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="A imagem deve ser JPEG, PNG ou WEBP")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="A imagem não pode exceder 5MB")

    filename = f"{uuid.uuid4().hex}.{ext}"
    (directory / filename).write_bytes(contents)

    return f"{url_prefix}/{filename}"


async def save_product_image(file: UploadFile) -> str:
    return await _save_image(file, PRODUCTS_DIR, "/uploads/products")


async def save_profile_photo(file: UploadFile) -> str:
    return await _save_image(file, PROFILES_DIR, "/uploads/profiles")
