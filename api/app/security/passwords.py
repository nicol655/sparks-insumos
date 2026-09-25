from pwdlib import PasswordHash

_hasher = PasswordHash.recommended()


class PasswordRejected(Exception):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def validate_password(password: str) -> None:
    if any(character.isspace() for character in password):
        raise PasswordRejected("whitespace")
    if not 8 <= len(password) <= 128:
        raise PasswordRejected("length")
    if not any(character.isupper() for character in password):
        raise PasswordRejected("uppercase")
    if not any(character.islower() for character in password):
        raise PasswordRejected("lowercase")
    if not any(character.isdigit() for character in password):
        raise PasswordRejected("digit")
    if not any(not character.isalnum() for character in password):
        raise PasswordRejected("special")


def validate_password_pair(password: str, confirmation: str) -> None:
    if password != confirmation:
        raise PasswordRejected("mismatch")
    validate_password(password)


def hash_password(password: str) -> str:
    # The bootstrap seed is not a chosen password, so this does not validate.
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _hasher.verify(password, password_hash)
