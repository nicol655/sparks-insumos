import pytest

from app.api.errors import DomainError
from app.storage import inspect_photo

_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
_JPEG = b"\xff\xd8\xff" + b"\x00" * 16
_WEBP = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 8


def test_accepts_png_jpeg_and_webp() -> None:
    assert inspect_photo("image/png", _PNG) == ".png"
    assert inspect_photo("image/jpeg", _JPEG) == ".jpg"
    assert inspect_photo("image/webp; charset=binary", _WEBP) == ".webp"


def test_rejects_a_header_that_does_not_match_the_type() -> None:
    with pytest.raises(DomainError) as caught:
        inspect_photo("image/png", b"hello")
    assert caught.value.status_code == 422
    assert caught.value.code == "photos_rejected"


def test_rejects_a_type_and_signature_that_disagree() -> None:
    with pytest.raises(DomainError) as caught:
        inspect_photo("image/jpeg", _PNG)
    assert caught.value.code == "photos_rejected"


def test_rejects_more_than_five_megabytes() -> None:
    body = _PNG + b"\x00" * (5 * 1024 * 1024)
    with pytest.raises(DomainError) as caught:
        inspect_photo("image/png", body)
    assert caught.value.code == "photos_rejected"
