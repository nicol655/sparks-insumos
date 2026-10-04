import asyncio
import logging
from typing import Protocol
from uuid import uuid4

from app.api.errors import DomainError

logger = logging.getLogger(__name__)

_MAX_BYTES = 5 * 1024 * 1024
_PHOTOS = "El producto necesita entre 1 y 8 fotos JPEG, PNG o WebP de hasta 5 MB."
_STORAGE = "No se pudieron guardar las fotos."
_KINDS = (
    ("image/jpeg", b"\xff\xd8", ".jpg"),
    ("image/png", b"\x89PNG\r\n\x1a\n", ".png"),
)


class ObjectStorage(Protocol):
    async def put(self, body: bytes, content_type: str) -> str: ...

    async def delete(self, key: str) -> None: ...

    async def presign_get(self, key: str) -> str: ...


def inspect_photo(content_type: str, body: bytes) -> str:
    if not body or len(body) > _MAX_BYTES:
        raise DomainError(422, "photos_rejected", _PHOTOS)
    kind = (content_type or "").split(";", 1)[0].strip().lower()
    if kind == "image/webp":
        if len(body) >= 12 and body[:4] == b"RIFF" and body[8:12] == b"WEBP":
            return ".webp"
        raise DomainError(422, "photos_rejected", _PHOTOS)
    for expected, magic, extension in _KINDS:
        if kind == expected:
            if body.startswith(magic):
                return extension
            raise DomainError(422, "photos_rejected", _PHOTOS)
    raise DomainError(422, "photos_rejected", _PHOTOS)


class S3Storage:
    def __init__(self, bucket: str, region: str, access_key: str, secret_key: str) -> None:
        self._bucket = bucket
        self._region = region
        self._access_key = access_key
        self._secret_key = secret_key

    def _ready(self) -> bool:
        return bool(self._bucket and self._region and self._access_key and self._secret_key)

    def _client(self) -> object:
        import boto3
        from botocore.config import Config

        # Keys come from api/.env via Settings. An empty string is not a
        # credential: boto3 would send it and skip the env chain.
        # The regional endpoint is required. bucket.s3.amazonaws.com answers
        # 307 to s3.<region>.amazonaws.com, and that hop breaks the signature.
        return boto3.client(
            "s3",
            region_name=self._region,
            endpoint_url=f"https://s3.{self._region}.amazonaws.com",
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
            config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
        )

    async def presign_get(self, key: str) -> str:
        if not self._ready():
            raise RuntimeError("storage is not configured")
        client = self._client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=3600,
        )

    async def put(self, body: bytes, content_type: str) -> str:
        extension = inspect_photo(content_type, body)
        if not self._ready():
            raise DomainError(502, "storage_failed", _STORAGE)
        key = f"products/{uuid4()}{extension}"
        client = self._client()

        def _upload() -> None:
            client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=body,
                ContentType=content_type,
            )

        try:
            await asyncio.to_thread(_upload)
        except Exception as exc:
            logger.exception("no se pudo subir %s", key)
            raise DomainError(502, "storage_failed", _STORAGE) from exc
        return key

    async def delete(self, key: str) -> None:
        if not self._ready():
            raise DomainError(502, "storage_failed", _STORAGE)
        client = self._client()

        def _remove() -> None:
            client.delete_object(Bucket=self._bucket, Key=key)

        try:
            await asyncio.to_thread(_remove)
        except Exception as exc:
            logger.exception("no se pudo borrar %s", key)
            raise DomainError(502, "storage_failed", _STORAGE) from exc
