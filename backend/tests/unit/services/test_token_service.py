import pytest

from app.services.token_service import TokenService


class TestTokenService:
    def test_generate_access_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            token, expires_in = service.generate_access_token(borrower_user)
            assert token is not None
            assert expires_in > 0

    def test_generate_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token = service.generate_refresh_token(borrower_user)
            assert raw_token is not None

    def test_verify_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token = service.generate_refresh_token(borrower_user)
            from app.extensions import db
            db.session.commit()
            refresh_token = service.verify_refresh_token(raw_token)
            assert refresh_token is not None
            assert refresh_token.user_id == borrower_user.id

    def test_revoke_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token = service.generate_refresh_token(borrower_user)
            from app.extensions import db
            db.session.commit()
            service.revoke_refresh_token(raw_token)
            db.session.commit()
            result = service.verify_refresh_token(raw_token)
            assert result is None
