from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.schemas.pagination import paginated_response
from app.schemas.recurring_loan_schemas import (
    CreateRecurringLoanSchema,
    GeneratedLoanRecordSchema,
    RecurringLoanSchema,
    UpdateRecurringLoanSchema,
)
from app.services.recurring_loan_service import RecurringLoanService

recurring_loan_bp = Blueprint(
    "recurring_loans", __name__, url_prefix="/api/v1/loans/recurring"
)

recurring_loan_schema = RecurringLoanSchema()
create_recurring_loan_schema = CreateRecurringLoanSchema()
update_recurring_loan_schema = UpdateRecurringLoanSchema()
generated_loan_record_schema = GeneratedLoanRecordSchema()


@recurring_loan_bp.route("", methods=["GET"])
@require_auth
def list_recurring_loans():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = RecurringLoanService()
    result = service.list_recurring_loans(g.current_user, page, per_page)
    return jsonify(paginated_response(recurring_loan_schema, result)), HTTPStatus.OK


@recurring_loan_bp.route("", methods=["POST"])
@require_auth
def create_recurring_loan():
    data = create_recurring_loan_schema.load(request.get_json())
    service = RecurringLoanService()
    recurring = service.create_recurring_loan(data, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.CREATED


@recurring_loan_bp.route("/<recurring_id>", methods=["GET"])
@require_auth
def get_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.get_recurring_loan(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>", methods=["PATCH"])
@require_auth
def update_recurring_loan(recurring_id):
    data = update_recurring_loan_schema.load(request.get_json())
    service = RecurringLoanService()
    recurring = service.update_recurring_loan(recurring_id, data, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/submit-for-approval", methods=["POST"])
@require_auth
def submit_for_approval(recurring_id):
    service = RecurringLoanService()
    recurring = service.submit_for_approval(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/approve", methods=["POST"])
@require_auth
def approve_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.approve(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/reject", methods=["POST"])
@require_auth
def reject_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.reject(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/pause", methods=["POST"])
@require_auth
def pause_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.pause(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/resume", methods=["POST"])
@require_auth
def resume_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.resume(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/cancel", methods=["POST"])
@require_auth
def cancel_recurring_loan(recurring_id):
    service = RecurringLoanService()
    recurring = service.cancel(recurring_id, g.current_user)
    return jsonify(recurring_loan_schema.dump(recurring)), HTTPStatus.OK


@recurring_loan_bp.route("/<recurring_id>/generated", methods=["GET"])
@require_auth
def list_generated_loans(recurring_id):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = RecurringLoanService()
    result = service.list_generated_loans(
        recurring_id, g.current_user, page, per_page
    )
    return (
        jsonify(paginated_response(generated_loan_record_schema, result)),
        HTTPStatus.OK,
    )
