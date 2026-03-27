from flask import Blueprint, jsonify, request

from app.extensions import limiter
from app.middleware.auth_middleware import get_current_user, require_auth
from app.schemas.auth_schemas import (
    ForgotPasswordRequestSchema,
    LoginRequestSchema,
    RefreshRequestSchema,
    ResetPasswordRequestSchema,
    SignUpRequestSchema,
    TokenResponseSchema,
)
from app.schemas.user_schemas import UserSchema
from app.services.auth_service import AuthService
from app.services.email_service import EmailService

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

login_schema = LoginRequestSchema()
signup_schema = SignUpRequestSchema()
forgot_password_schema = ForgotPasswordRequestSchema()
reset_password_schema = ResetPasswordRequestSchema()
refresh_schema = RefreshRequestSchema()
token_response_schema = TokenResponseSchema()
user_schema = UserSchema()


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5/minute")
def login():
    data = login_schema.load(request.get_json())
    auth_service = AuthService()
    token_pair = auth_service.login(data["email"], data["password"])
    return jsonify(token_response_schema.dump(token_pair)), 200


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("5/minute")
def signup():
    data = signup_schema.load(request.get_json())
    auth_service = AuthService()
    user = auth_service.signup(
        name=data["name"],
        email=data["email"],
        password=data["password"],
        confirm_password=data["confirm_password"],
    )
    return jsonify(user_schema.dump(user)), 201


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit("5/minute")
def forgot_password():
    data = forgot_password_schema.load(request.get_json())
    auth_service = AuthService()
    reset_token = auth_service.forgot_password(data["email"])

    if reset_token:
        email_service = EmailService()
        email_service.send_password_reset(data["email"], reset_token)

    return jsonify({"message": "If the email exists, a reset link has been sent"}), 200


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit("5/minute")
def reset_password():
    data = reset_password_schema.load(request.get_json())
    auth_service = AuthService()
    auth_service.reset_password(
        token=data["token"],
        password=data["password"],
        confirm_password=data["confirm_password"],
    )
    return jsonify({"message": "Password has been reset successfully"}), 200


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = refresh_schema.load(request.get_json())
    auth_service = AuthService()
    token_pair = auth_service.refresh(data["refresh_token"])
    return jsonify(token_response_schema.dump(token_pair)), 200


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    data = request.get_json() or {}
    auth_service = AuthService()
    auth_service.logout(data.get("refresh_token"))
    return "", 204
