from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_role
from app.schemas.pagination import paginated_response
from app.schemas.user_schemas import CreateUserRequestSchema, UpdateUserRequestSchema, UserSchema
from app.services.user_service import UserService

user_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

user_schema = UserSchema()
create_user_schema = CreateUserRequestSchema()
update_user_schema = UpdateUserRequestSchema()


@user_bp.route("", methods=["GET"])
@require_role("Admin")
def list_users():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search")
    role = request.args.get("role")
    is_active = request.args.get("is_active")
    if is_active is not None:
        is_active = is_active.lower() == "true"

    user_service = UserService()
    result = user_service.list_users(
        page=page, per_page=per_page, search=search, role=role, is_active=is_active
    )
    return jsonify(paginated_response(user_schema, result)), 200


@user_bp.route("/<user_id>", methods=["GET"])
@require_role("Admin")
def get_user(user_id):
    user_service = UserService()
    user = user_service.get_user(user_id)
    return jsonify(user_schema.dump(user)), 200


@user_bp.route("", methods=["POST"])
@require_role("Admin")
def create_user():
    data = create_user_schema.load(request.get_json())
    user_service = UserService()
    user = user_service.create_user(data, actor_id=g.current_user.id)
    return jsonify(user_schema.dump(user)), 201


@user_bp.route("/<user_id>", methods=["PUT"])
@require_role("Admin")
def update_user(user_id):
    data = update_user_schema.load(request.get_json())
    user_service = UserService()
    user = user_service.update_user(user_id, data, actor_id=g.current_user.id)
    return jsonify(user_schema.dump(user)), 200


@user_bp.route("/<user_id>", methods=["DELETE"])
@require_role("Admin")
def delete_user(user_id):
    user_service = UserService()
    user_service.delete_user(user_id, actor_id=g.current_user.id)
    return "", 204
