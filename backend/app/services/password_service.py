from __future__ import annotations

import bcrypt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


class PasswordService:
    def __init__(self) -> None:
        """Initialize PasswordService with an Argon2id hasher."""
        self._hasher = PasswordHasher()

    def hash_password(self, password: str) -> str:
        """Hash a plaintext password using Argon2id."""
        return self._hasher.hash(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a plaintext password against a stored hash.

        Supports both bcrypt (legacy) and Argon2id hashes transparently.

        Args:
            password: The plaintext password to verify.
            password_hash: The stored hash to verify against.

        Returns:
            True if the password matches, False otherwise.
        """
        # Transparent upgrade: detect bcrypt hashes by prefix
        if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
            return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
        # Argon2id verification
        try:
            return self._hasher.verify(password_hash, password)
        except VerifyMismatchError:
            return False

    def needs_rehash(self, password_hash: str) -> bool:
        """Check if a hash should be upgraded to Argon2id."""
        if password_hash.startswith("$2b$") or password_hash.startswith("$2a$"):
            return True
        return self._hasher.check_needs_rehash(password_hash)
