import pytest

from app.extensions import db
from app.services.token_service import TokenService


class TestTokenService:
    def test_generate_access_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            _, session = service.create_session(borrower_user)
            db.session.flush()
            token, expires_in = service.generate_access_token(borrower_user, session.id)
            assert token is not None
            assert expires_in > 0

    def test_generate_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token, session = service.create_session(borrower_user)
            db.session.commit()
            assert raw_token is not None
            assert session is not None

    def test_verify_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token, session = service.create_session(borrower_user)
            db.session.commit()
            verified_session = service.verify_session(raw_token)
            assert verified_session is not None
            assert verified_session.user_id == borrower_user.id

    def test_revoke_refresh_token(self, app, borrower_user):
        with app.app_context():
            service = TokenService()
            raw_token, session = service.create_session(borrower_user)
            db.session.commit()
            service.revoke_session(session)
            db.session.commit()
            result = service.verify_session(raw_token)
            assert result is None
