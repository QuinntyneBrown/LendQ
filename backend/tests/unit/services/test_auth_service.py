import pytest

from app.errors.exceptions import AuthenticationError, ConflictError, ValidationError
from app.services.auth_service import AuthService


class TestAuthService:
    def test_login_success(self, app, borrower_user):
        with app.app_context():
            service = AuthService()
            token_bundle, raw_session_token = service.login("borrower@test.com", "testpassword123")
            assert "access_token" in token_bundle
            assert raw_session_token is not None

    def test_login_wrong_password(self, app, borrower_user):
        with app.app_context():
            service = AuthService()
            with pytest.raises(AuthenticationError):
                service.login("borrower@test.com", "wrongpassword")

    def test_login_nonexistent_user(self, app):
        with app.app_context():
            service = AuthService()
            with pytest.raises(AuthenticationError):
                service.login("nobody@test.com", "password")

    def test_signup_success(self, app):
        with app.app_context():
            service = AuthService()
            user, verification_token = service.signup("New User", "new@test.com", "password123", "password123")
            assert user.name == "New User"
            assert user.email == "new@test.com"
            assert user.has_role("Borrower")

    def test_signup_password_mismatch(self, app):
        with app.app_context():
            service = AuthService()
            with pytest.raises(ValidationError):
                service.signup("New User", "new2@test.com", "password123", "different")

    def test_signup_duplicate_email(self, app, borrower_user):
        with app.app_context():
            service = AuthService()
            with pytest.raises(ConflictError):
                service.signup("Another", "borrower@test.com", "password123", "password123")
