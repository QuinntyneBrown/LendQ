from http import HTTPStatus

from flask import Blueprint, jsonify, request

from app.middleware.auth_middleware import require_role
from app.schemas.role_schemas import PermissionUpdateRequestSchema, RoleSchema
from app.services.role_service import RoleService

role_bp = Blueprint("roles", __name__, url_prefix="/api/v1/roles")

role_schema = RoleSchema()
permission_update_schema = PermissionUpdateRequestSchema()


@role_bp.route("/", methods=["GET"])
@require_role("Admin")
def list_roles():
    role_service = RoleService()
    roles = role_service.list_roles()
    return jsonify(role_schema.dump(roles, many=True)), HTTPStatus.OK


@role_bp.route("/<role_id>", methods=["GET"])
@require_role("Admin")
def get_role(role_id):
    role_service = RoleService()
    role = role_service.get_role(role_id)
    return jsonify(role_schema.dump(role)), HTTPStatus.OK


@role_bp.route("/<role_key>/permissions", methods=["PUT"])
@require_role("Admin")
def update_permissions(role_key):
    data = permission_update_schema.load(request.get_json())
    role_service = RoleService()
    role = role_service.update_permissions_by_name(role_key, data["permissions"])
    return jsonify(role_schema.dump(role)), HTTPStatus.OK
