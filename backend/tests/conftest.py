import os

import pytest

os.environ["FLASK_ENV"] = "testing"

from app import create_app
from app.extensions import db as _db
from app.models.user import Role, User
from app.services.password_service import PasswordService


@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite://"
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"connect_args": {"check_same_thread": False}}
    ctx = app.app_context()
    ctx.push()
    _db.create_all()
    yield app
    _db.session.remove()
    _db.drop_all()
    ctx.pop()


@pytest.fixture(autouse=True)
def clean_db(app):
    # Seed roles each test
    _seed_roles()
    _db.session.commit()
    yield
    # Clean all data after test
    _db.session.remove()
    meta = _db.metadata
    with _db.engine.begin() as conn:
        for table in reversed(meta.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def admin_user(clean_db):
    return _create_user("Admin User", "admin@test.com", "Admin")


@pytest.fixture
def creditor_user(clean_db):
    return _create_user("Creditor User", "creditor@test.com", "Creditor")


@pytest.fixture
def borrower_user(clean_db):
    return _create_user("Borrower User", "borrower@test.com", "Borrower")


@pytest.fixture
def auth_headers():
    def _headers(user):
        from app.services.token_service import TokenService

        token_service = TokenService()
        _, session = token_service.create_session(user)
        access_token, _ = token_service.generate_access_token(user, session.id)
        _db.session.commit()
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    return _headers


def _seed_roles():
    for name, desc in [
        ("Admin", "System administrator"),
        ("Creditor", "Loan creator/manager"),
        ("Borrower", "Loan recipient"),
    ]:
        existing = Role.query.filter_by(name=name).first()
        if not existing:
            _db.session.add(Role(name=name, description=desc, permissions=[]))
    _db.session.flush()


def _create_user(name, email, role_name):
    password_service = PasswordService()
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    user = User(
        name=name,
        email=email,
        password_hash=password_service.hash_password("testpassword123"),
        email_verified=True,
        session_version=1,
    )
    role = Role.query.filter_by(name=role_name).first()
    if role:
        user.roles.append(role)
    _db.session.add(user)
    _db.session.commit()
    return user


def assert_error_response(resp, expected_status, expected_code=None):
    """Assert an error response follows the standard envelope format."""
    assert resp.status_code == expected_status
    data = resp.get_json()
    assert "message" in data
    assert "code" in data
    assert "request_id" in data
    if expected_code:
        assert data["code"] == expected_code
    return data
