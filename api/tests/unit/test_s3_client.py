from unittest.mock import patch

import pytest

from app.api.errors import DomainError
from app.storage import S3Storage

_PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


async def test_boto3_receives_the_credentials_from_settings() -> None:
    storage = S3Storage(
        bucket="sparks-photos-dev",
        region="sa-east-1",
        access_key="AKIADEVEXAMPLEKEY12",
        secret_key="secret-from-env",
    )

    with patch("boto3.client") as client_factory:
        client = client_factory.return_value
        key = await storage.put(_PNG, "image/png")

    client_factory.assert_called_once_with(
        "s3",
        region_name="sa-east-1",
        endpoint_url="https://s3.sa-east-1.amazonaws.com",
        aws_access_key_id="AKIADEVEXAMPLEKEY12",
        aws_secret_access_key="secret-from-env",
        config=client_factory.call_args.kwargs["config"],
    )
    assert client_factory.call_args.kwargs["config"].signature_version == "s3v4"
    put = client.put_object.call_args.kwargs
    assert put["Bucket"] == "sparks-photos-dev"
    assert put["Key"] == key
    assert put["Body"] == _PNG
    assert put["ContentType"] == "image/png"


async def test_presign_asks_boto3_for_an_hour() -> None:
    storage = S3Storage(
        bucket="sparks-photos-dev",
        region="sa-east-1",
        access_key="AKIADEVEXAMPLEKEY12",
        secret_key="secret-from-env",
    )

    with patch("boto3.client") as client_factory:
        client_factory.return_value.generate_presigned_url.return_value = "https://signed.example/a"
        url = await storage.presign_get("products/a.png")

    client_factory.return_value.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "sparks-photos-dev", "Key": "products/a.png"},
        ExpiresIn=3600,
    )
    assert url == "https://signed.example/a"


async def test_missing_credentials_do_not_open_a_client() -> None:
    storage = S3Storage(bucket="sparks-photos-dev", region="sa-east-1", access_key="", secret_key="")

    with patch("boto3.client") as client_factory, pytest.raises(DomainError) as caught:
        await storage.put(_PNG, "image/png")

    assert caught.value.status_code == 502
    assert caught.value.code == "storage_failed"
    client_factory.assert_not_called()
