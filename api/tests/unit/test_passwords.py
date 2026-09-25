import pytest

from app.security.passwords import (
    PasswordRejected,
    hash_password,
    validate_password,
    validate_password_pair,
    verify_password,
)


def test_accepts_sparks1() -> None:
    validate_password("Sparks1!")
    validate_password_pair("Sparks1!", "Sparks1!")


@pytest.mark.parametrize(
    "password",
    [
        "sparks1!",
        "SPARKS1!",
        "Sparks!!",
        "Sparks12",
        "Sparks 1!",
        "Spark1!",
        "Aa1!" + ("a" * 125),
        "admin123456",
    ],
)
def test_rejects_passwords_outside_the_policy(password: str) -> None:
    with pytest.raises(PasswordRejected):
        validate_password(password)


def test_rejects_a_pair_that_does_not_match() -> None:
    with pytest.raises(PasswordRejected):
        validate_password_pair("Sparks1!", "Sparks2!")


def test_exactly_128_characters_is_accepted() -> None:
    validate_password("Aa1!" + ("a" * 124))


def test_hash_does_not_apply_the_policy_and_hides_the_secret() -> None:
    hashed = hash_password("admin123456")

    assert hashed != "admin123456"
    assert "admin123456" not in hashed
    assert hashed.startswith("$argon2")
    assert verify_password("admin123456", hashed)
    assert not verify_password("Sparks1!", hashed)


def test_chosen_password_hash_verifies() -> None:
    hashed = hash_password("Sparks1!")

    assert "Sparks1!" not in hashed
    assert verify_password("Sparks1!", hashed)
