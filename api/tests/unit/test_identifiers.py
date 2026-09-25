import pytest

from app.security.identifiers import IdentifierRejected, normalize_email, normalize_phone


def test_email_is_trimmed_and_lowercased() -> None:
    assert normalize_email("  Ana@Example.COM  ") == "ana@example.com"


def test_phone_is_trimmed_when_it_has_a_country_prefix() -> None:
    assert normalize_phone("  +5491168692694  ") == "+5491168692694"
    assert normalize_phone("+540000000000") == "+540000000000"


@pytest.mark.parametrize("phone", ["5491168692694", "+123", "+", "+abcd", "a" * 33])
def test_phone_rejects_missing_prefix_or_bad_length(phone: str) -> None:
    with pytest.raises(IdentifierRejected):
        normalize_phone(phone)
