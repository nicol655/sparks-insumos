from uuid import uuid4

from app.storage import inspect_photo


class MemoryStorage:
    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}
        self.deleted: list[str] = []

    async def put(self, body: bytes, content_type: str) -> str:
        extension = inspect_photo(content_type, body)
        key = f"products/{uuid4()}{extension}"
        self.objects[key] = body
        return key

    async def delete(self, key: str) -> None:
        self.deleted.append(key)
        self.objects.pop(key, None)

    async def presign_get(self, key: str) -> str:
        return f"memory:{key}"
