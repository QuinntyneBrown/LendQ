import logging
from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth, require_role
from app.middleware.idempotency import require_idempotency
from app.schemas.bank_account_schemas import (
    BankAccountSchema,
    BankTransactionSchema,
    CreateRecurringDepositSchema,
    DepositRequestSchema,
    RecurringDepositSchema,
    UpdateRecurringDepositSchema,
    WithdrawRequestSchema,
)
from app.schemas.pagination import paginated_response
from app.services.bank_account_service import BankAccountService

logger = logging.getLogger(__name__)

account_bp = Blueprint("accounts", __name__, url_prefix="/api/v1/accounts")

account_schema = BankAccountSchema()
txn_schema = BankTransactionSchema()
deposit_request_schema = DepositRequestSchema()
withdraw_request_schema = WithdrawRequestSchema()
create_recurring_schema = CreateRecurringDepositSchema()
update_recurring_schema = UpdateRecurringDepositSchema()
recurring_schema = RecurringDepositSchema()


@account_bp.route("", methods=["GET"])
@require_auth
def list_accounts():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = BankAccountService()
    result = service.list_accounts(g.current_user, page, per_page)
    return jsonify(paginated_response(account_schema, result)), HTTPStatus.OK


@account_bp.route("/<account_id>", methods=["GET"])
@require_auth
def get_account(account_id):
    service = BankAccountService()
    account = service.get_account(account_id, g.current_user)
    return jsonify(account_schema.dump(account)), HTTPStatus.OK


@account_bp.route("/<account_id>/deposit", methods=["POST"])
@require_auth
@require_idempotency
def deposit(account_id):
    data = deposit_request_schema.load(request.get_json())
    idempotency_key = request.headers.get("Idempotency-Key")
    service = BankAccountService()
    txn = service.deposit(account_id, data, g.current_user, idempotency_key)
    return jsonify(txn_schema.dump(txn)), HTTPStatus.CREATED


@account_bp.route("/<account_id>/withdraw", methods=["POST"])
@require_auth
@require_idempotency
def withdraw(account_id):
    data = withdraw_request_schema.load(request.get_json())
    idempotency_key = request.headers.get("Idempotency-Key")
    service = BankAccountService()
    txn = service.withdraw(account_id, data, g.current_user, idempotency_key)
    return jsonify(txn_schema.dump(txn)), HTTPStatus.CREATED


@account_bp.route("/transactions/<transaction_id>/reversals", methods=["POST"])
@require_auth
@require_idempotency
def reverse_transaction(transaction_id):
    data = request.get_json() or {}
    idempotency_key = request.headers.get("Idempotency-Key")
    service = BankAccountService()
    txn = service.reverse_transaction(transaction_id, data, g.current_user, idempotency_key)
    return jsonify(txn_schema.dump(txn)), HTTPStatus.CREATED


@account_bp.route("/<account_id>/transactions", methods=["GET"])
@require_auth
def list_transactions(account_id):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    entry_type = request.args.get("entry_type")
    service = BankAccountService()
    result = service.list_transactions(account_id, g.current_user, page, per_page, entry_type)
    return jsonify(paginated_response(txn_schema, result)), HTTPStatus.OK


@account_bp.route("/<account_id>/recurring-deposits", methods=["POST"])
@require_auth
def create_recurring_deposit(account_id):
    data = create_recurring_schema.load(request.get_json())
    service = BankAccountService()
    deposit = service.create_recurring_deposit(account_id, data, g.current_user)
    return jsonify(recurring_schema.dump(deposit)), HTTPStatus.CREATED


@account_bp.route("/<account_id>/recurring-deposits", methods=["GET"])
@require_auth
def list_recurring_deposits(account_id):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = BankAccountService()
    result = service.list_recurring_deposits(account_id, g.current_user, page, per_page)
    return jsonify(paginated_response(recurring_schema, result)), HTTPStatus.OK


@account_bp.route("/<account_id>/recurring-deposits/<deposit_id>", methods=["PATCH"])
@require_auth
def update_recurring_deposit(account_id, deposit_id):
    data = update_recurring_schema.load(request.get_json())
    service = BankAccountService()
    deposit = service.update_recurring_deposit(account_id, deposit_id, data, g.current_user)
    return jsonify(recurring_schema.dump(deposit)), HTTPStatus.OK


@account_bp.route("/<account_id>/recurring-deposits/<deposit_id>/pause", methods=["POST"])
@require_auth
def pause_recurring_deposit(account_id, deposit_id):
    service = BankAccountService()
    deposit = service.pause_recurring_deposit(account_id, deposit_id, g.current_user)
    return jsonify(recurring_schema.dump(deposit)), HTTPStatus.OK


@account_bp.route("/<account_id>/recurring-deposits/<deposit_id>/resume", methods=["POST"])
@require_auth
def resume_recurring_deposit(account_id, deposit_id):
    service = BankAccountService()
    deposit = service.resume_recurring_deposit(account_id, deposit_id, g.current_user)
    return jsonify(recurring_schema.dump(deposit)), HTTPStatus.OK


@account_bp.route("/<account_id>/recurring-deposits/<deposit_id>", methods=["DELETE"])
@require_auth
def cancel_recurring_deposit(account_id, deposit_id):
    service = BankAccountService()
    service.cancel_recurring_deposit(account_id, deposit_id, g.current_user)
    return jsonify({"message": "Recurring deposit cancelled"}), HTTPStatus.OK
