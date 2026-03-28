try:
    import bcrypt
except ImportError:
    bcrypt = None

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


class PasswordService:
    def __init__(self):
        self._hasher = PasswordHasher()

    def hash_password(self, password):
        return self._hasher.hash(password)

    def verify_password(self, password, password_hash):
        # Transparent upgrade: detect bcrypt hashes by prefix
        if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
            if bcrypt is None:
                return False
            return bcrypt.checkpw(
                password.encode("utf-8"), password_hash.encode("utf-8")
            )
        # Argon2id verification
        try:
            return self._hasher.verify(password_hash, password)
        except VerifyMismatchError:
            return False

    def needs_rehash(self, password_hash):
        """Check if a hash should be upgraded to argon2id."""
        if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
            return True
        return self._hasher.check_needs_rehash(password_hash)
