class IdentifierRejected(Exception):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    value = phone.strip()
    if not 6 <= len(value) <= 32:
        raise IdentifierRejected("length")
    if not value.startswith("+"):
        raise IdentifierRejected("prefix")
    if not any(character.isdigit() for character in value):
        raise IdentifierRejected("digit")
    return value
