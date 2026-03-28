from app.services.password_service import PasswordService


class TestPasswordService:
    def setup_method(self):
        self.service = PasswordService()

    def test_hash_password_returns_hash(self):
        hashed = self.service.hash_password("testpassword")
        assert hashed != "testpassword"
        assert hashed.startswith("$2b$")

    def test_verify_correct_password(self):
        hashed = self.service.hash_password("testpassword")
        assert self.service.verify_password("testpassword", hashed) is True

    def test_verify_wrong_password(self):
        hashed = self.service.hash_password("testpassword")
        assert self.service.verify_password("wrongpassword", hashed) is False

    def test_different_hashes_for_same_password(self):
        hash1 = self.service.hash_password("testpassword")
        hash2 = self.service.hash_password("testpassword")
        assert hash1 != hash2
