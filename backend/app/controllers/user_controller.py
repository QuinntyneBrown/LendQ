from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.controllers.pagination import parse_pagination
from app.middleware.auth_middleware import require_role
from app.schemas.pagination import paginated_response
from app.schemas.user_schemas import CreateUserRequestSchema, UpdateUserRequestSchema, UserSchema
from app.services.user_service import UserService

user_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

user_schema = UserSchema()
create_user_schema = CreateUserRequestSchema()
update_user_schema = UpdateUserRequestSchema()


@user_bp.route("/", methods=["GET"])
@require_role("Admin")
def list_users():
    page, per_page = parse_pagination()
    search = request.args.get("search")
    role = request.args.get("role")
    is_active = request.args.get("is_active")
    if is_active is not None:
        is_active = is_active.lower() == "true"

    user_service = UserService()
    result = user_service.list_users(
        page=page, per_page=per_page, search=search, role=role, is_active=is_active
    )
    return jsonify(paginated_response(user_schema, result)), HTTPStatus.OK


@user_bp.route("/", methods=["POST"])
@require_role("Admin")
def create_user():
    data = create_user_schema.load(request.get_json())
    user_service = UserService()
    user = user_service.create_user(data, actor_id=g.current_user.id)
    return jsonify(user_schema.dump(user)), HTTPStatus.CREATED


@user_bp.route("/borrowers", methods=["GET"])
@require_role("Creditor", "Admin")
def list_borrowers():
    search = request.args.get("search", "")
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 50)

    from app.extensions import db
    from app.models.user import Role, User

    query = User.query.join(User.roles).filter(
        Role.name == "Borrower",
        User.is_active == True,
        User.email_verified == True,
    )
    if search:
        query = query.filter(
            db.or_(
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
        )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    items = [{"id": u.id, "name": u.name, "email": u.email} for u in pagination.items]
    return jsonify(
        {
            "items": items,
            "total": pagination.total,
            "page": page,
            "per_page": per_page,
        }
    ), HTTPStatus.OK


@user_bp.route("/<user_id>", methods=["GET"])
@require_role("Admin")
def get_user(user_id):
    user_service = UserService()
    user = user_service.get_user(user_id)
    return jsonify(user_schema.dump(user)), HTTPStatus.OK


@user_bp.route("/<user_id>", methods=["PATCH"])
@require_role("Admin")
def update_user(user_id):
    data = update_user_schema.load(request.get_json())
    user_service = UserService()
    user = user_service.update_user(user_id, data, actor_id=g.current_user.id)
    return jsonify(user_schema.dump(user)), HTTPStatus.OK


@user_bp.route("/<user_id>", methods=["DELETE"])
@require_role("Admin")
def delete_user(user_id):
    user_service = UserService()
    user_service.delete_user(user_id, actor_id=g.current_user.id)
    return jsonify({"message": "User deleted"}), HTTPStatus.OK


@user_bp.route("/<user_id>/purge", methods=["DELETE"])
@require_role("Admin")
def purge_user(user_id):
    force = request.args.get("force", "").lower() == "true"
    user_service = UserService()
    user_service.purge_user(user_id, actor_id=g.current_user.id, force=force)
    return jsonify({"message": "User permanently deleted"}), HTTPStatus.OK


@user_bp.route("/<user_id>/reset-password", methods=["POST"])
@require_role("Admin")
def admin_reset_password(user_id):
    data = request.get_json()
    password = data.get("password")
    if not password or len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), HTTPStatus.BAD_REQUEST

    from app.services.password_service import PasswordService

    user_service = UserService()
    user = user_service.get_user(user_id)
    user.password_hash = PasswordService().hash_password(password)

    from app.extensions import db
    db.session.commit()

    return jsonify({"message": "Password reset successfully"}), HTTPStatus.OK
