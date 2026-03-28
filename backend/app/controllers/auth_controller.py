from http import HTTPStatus

from flask import Blueprint, current_app, g, jsonify, make_response, request

from app.extensions import limiter
from app.middleware.auth_middleware import require_auth
from app.schemas.auth_schemas import (
    EmailVerificationConfirmSchema,
    EmailVerificationResendSchema,
    ForgotPasswordRequestSchema,
    LoginRequestSchema,
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
verification_confirm_schema = EmailVerificationConfirmSchema()
verification_resend_schema = EmailVerificationResendSchema()
token_response_schema = TokenResponseSchema()

SESSION_COOKIE_NAME = "lendq_session"


def _set_session_cookie(response, raw_session_token):
    response.set_cookie(
        SESSION_COOKIE_NAME,
        value=raw_session_token,
        httponly=True,
        secure=True,
        samesite="Strict",
        path="/api/v1/auth",
        max_age=7 * 24 * 3600,
    )
    return response


def _clear_session_cookie(response):
    response.delete_cookie(SESSION_COOKIE_NAME, path="/api/v1/auth")
    return response


@auth_bp.route("/login", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def login():
    data = login_schema.load(request.get_json())
    auth_service = AuthService()
    token_bundle, raw_session_token = auth_service.login(
        email=data["email"],
        password=data["password"],
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )
    response = make_response(jsonify(token_response_schema.dump(token_bundle)), HTTPStatus.OK)
    _set_session_cookie(response, raw_session_token)
    return response


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def signup():
    data = signup_schema.load(request.get_json())
    auth_service = AuthService()
    user, verification_token = auth_service.signup(
        name=data["name"],
        email=data["email"],
        password=data["password"],
        confirm_password=data["confirm_password"],
    )

    if verification_token:
        email_service = EmailService()
        try:
            email_service.send_email(
                data["email"],
                "Verify your LendQ account",
                f"Your verification token: {verification_token}",
            )
        except Exception:
            pass  # Don't fail signup if email fails

    return "", HTTPStatus.CREATED


@auth_bp.route("/email-verification/resend", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def resend_verification():
    data = verification_resend_schema.load(request.get_json())
    auth_service = AuthService()
    raw_token = auth_service.resend_verification(data["email"])

    if raw_token:
        email_service = EmailService()
        try:
            email_service.send_email(
                data["email"],
                "Verify your LendQ account",
                f"Your verification token: {raw_token}",
            )
        except Exception:
            pass

    return "", HTTPStatus.ACCEPTED


@auth_bp.route("/email-verification/confirm", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def confirm_verification():
    data = verification_confirm_schema.load(request.get_json())
    auth_service = AuthService()
    auth_service.verify_email(data["token"])
    return "", HTTPStatus.OK


@auth_bp.route("/forgot-password", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def forgot_password():
    data = forgot_password_schema.load(request.get_json())
    auth_service = AuthService()
    reset_token = auth_service.forgot_password(data["email"])

    if reset_token:
        email_service = EmailService()
        email_service.send_password_reset(data["email"], reset_token)

    msg = {"message": "If the email exists, a reset link has been sent"}
    return jsonify(msg), HTTPStatus.ACCEPTED


@auth_bp.route("/reset-password", methods=["POST"])
@limiter.limit(lambda: current_app.config.get("RATE_LIMIT_AUTH", "5/minute"))
def reset_password():
    data = reset_password_schema.load(request.get_json())
    auth_service = AuthService()
    auth_service.reset_password(
        token=data["token"],
        password=data["password"],
        confirm_password=data["confirm_password"],
    )
    return "", HTTPStatus.OK


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    raw_session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not raw_session_token:
        from app.errors.exceptions import AuthenticationError

        raise AuthenticationError("No session cookie present")

    auth_service = AuthService()
    token_bundle, new_raw_token = auth_service.refresh(
        raw_session_token,
        user_agent=request.headers.get("User-Agent"),
        ip_address=request.remote_addr,
    )
    response = make_response(jsonify(token_response_schema.dump(token_bundle)), HTTPStatus.OK)
    _set_session_cookie(response, new_raw_token)
    return response


@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    user_schema = UserSchema()
    return jsonify(user_schema.dump(g.current_user)), HTTPStatus.OK


@auth_bp.route("/logout", methods=["POST"])
@require_auth
def logout():
    raw_session_token = request.cookies.get(SESSION_COOKIE_NAME)
    auth_service = AuthService()
    auth_service.logout(raw_session_token)
    response = make_response("", HTTPStatus.NO_CONTENT)
    _clear_session_cookie(response)
    return response


@auth_bp.route("/logout-all", methods=["POST"])
@require_auth
def logout_all():
    auth_service = AuthService()
    auth_service.logout_all(g.current_user.id)
    response = make_response("", HTTPStatus.NO_CONTENT)
    _clear_session_cookie(response)
    return response


@auth_bp.route("/sessions", methods=["GET"])
@require_auth
def list_sessions():
    auth_service = AuthService()
    sessions = auth_service.get_sessions(g.current_user.id)
    current_session_id = g.token_payload.get("session_id")
    result = []
    for s in sessions:
        result.append(
            {
                "id": s.id,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "last_seen_at": s.last_seen_at.isoformat() if s.last_seen_at else None,
                "user_agent": s.user_agent,
                "ip_address": s.ip_address,
                "is_current": s.id == current_session_id,
            }
        )
    return jsonify({"items": result}), HTTPStatus.OK


@auth_bp.route("/sessions/<session_id>", methods=["DELETE"])
@require_auth
def revoke_session(session_id):
    auth_service = AuthService()
    auth_service.revoke_session(session_id, g.current_user.id)
    return "", HTTPStatus.NO_CONTENT
