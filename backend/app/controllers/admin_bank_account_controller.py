import logging
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_role
from app.schemas.bank_account_schemas import (
    AdminAccountDetailSchema,
    AdminAccountListItemSchema,
    AdminAccountStatsSchema,
    BankAccountSchema,
    ChangeStatusSchema,
    CreateAdminAccountSchema,
)
from app.services.bank_account_service import BankAccountService

logger = logging.getLogger(__name__)

admin_accounts_bp = Blueprint(
    "admin_accounts", __name__, url_prefix="/api/v1/admin/accounts"
)

account_schema = BankAccountSchema()
list_item_schema = AdminAccountListItemSchema()
stats_schema = AdminAccountStatsSchema()
create_schema = CreateAdminAccountSchema()
change_status_schema = ChangeStatusSchema()
detail_schema = AdminAccountDetailSchema()


@admin_accounts_bp.route("", methods=["GET"])
@require_role("Admin")
def list_admin_accounts():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search")
    status = request.args.get("status")

    result = BankAccountService.admin_list_accounts(
        page=page, per_page=per_page, search=search, status=status
    )

    return jsonify(
        {
            "items": list_item_schema.dump(result["items"], many=True),
            "total": result["total"],
            "page": result["page"],
            "per_page": result["per_page"],
            "pages": result["pages"],
            "stats": stats_schema.dump(result["stats"]),
        }
    ), HTTPStatus.OK


@admin_accounts_bp.route("", methods=["POST"])
@require_role("Admin")
def create_admin_account():
    data = create_schema.load(request.get_json())
    service = BankAccountService()
    account = service.admin_create_account(
        user_id=data["user_id"],
        currency=data.get("currency", "USD"),
        initial_deposit=data.get("initial_deposit", 0),
        note=data.get("note"),
        admin_user=g.current_user,
    )
    return jsonify(account_schema.dump(account)), HTTPStatus.CREATED


@admin_accounts_bp.route("/<account_id>", methods=["GET"])
@require_role("Admin")
def get_admin_account_detail(account_id):
    result = BankAccountService.admin_get_account_detail(account_id)
    return jsonify(detail_schema.dump(result)), HTTPStatus.OK


@admin_accounts_bp.route("/<account_id>/status", methods=["PATCH"])
@require_role("Admin")
def change_account_status(account_id):
    data = change_status_schema.load(request.get_json())
    service = BankAccountService()
    account = service.admin_change_status(
        account_id=account_id,
        new_status=data["status"],
        reason=data["reason"],
        admin_user=g.current_user,
    )
    return jsonify(account_schema.dump(account)), HTTPStatus.OK
