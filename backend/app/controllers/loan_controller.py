from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.schemas.loan_schemas import CreateLoanRequestSchema, LoanSchema, UpdateLoanRequestSchema
from app.schemas.pagination import paginated_response
from app.services.loan_governance_service import LoanGovernanceService
from app.services.loan_service import LoanService

loan_bp = Blueprint("loans", __name__, url_prefix="/api/v1/loans")

loan_schema = LoanSchema()
create_loan_schema = CreateLoanRequestSchema()
update_loan_schema = UpdateLoanRequestSchema()


@loan_bp.route("/", methods=["GET"])
@require_auth
def list_loans():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    tab = request.args.get("tab", "creditor")
    status = request.args.get("status")
    loan_service = LoanService()
    result = loan_service.list_loans(g.current_user, page, per_page, tab, status)
    return jsonify(paginated_response(loan_schema, result)), HTTPStatus.OK


@loan_bp.route("/<loan_id>", methods=["GET"])
@require_auth
def get_loan(loan_id):
    loan_service = LoanService()
    loan = loan_service.get_loan(loan_id, g.current_user)
    return jsonify(loan_schema.dump(loan)), HTTPStatus.OK


@loan_bp.route("/", methods=["POST"])
@require_auth
def create_loan():
    data = create_loan_schema.load(request.get_json())
    loan_service = LoanService()
    loan = loan_service.create_loan(data, g.current_user)
    return jsonify(loan_schema.dump(loan)), HTTPStatus.CREATED


@loan_bp.route("/<loan_id>", methods=["PATCH"])
@require_auth
def update_loan(loan_id):
    data = update_loan_schema.load(request.get_json())
    loan_service = LoanService()
    loan = loan_service.update_loan(loan_id, data, g.current_user)
    return jsonify(loan_schema.dump(loan)), HTTPStatus.OK


@loan_bp.route("/<loan_id>/terms-versions", methods=["GET"])
@require_auth
def get_terms_versions(loan_id):
    governance = LoanGovernanceService()
    versions = governance.get_terms_versions(loan_id, g.current_user)
    result = []
    for v in versions:
        result.append(
            {
                "version": v.version,
                "effective_at": v.effective_at.isoformat() if v.effective_at else None,
                "principal_amount": str(v.principal_amount),
                "currency": v.currency,
                "interest_rate_percent": str(v.interest_rate_percent),
                "repayment_frequency": v.repayment_frequency,
                "installment_count": v.installment_count,
                "maturity_date": v.maturity_date.isoformat() if v.maturity_date else None,
                "start_date": v.start_date.isoformat() if v.start_date else None,
            }
        )
    return jsonify({"items": result}), HTTPStatus.OK


@loan_bp.route("/<loan_id>/change-requests", methods=["GET"])
@require_auth
def list_change_requests(loan_id):
    governance = LoanGovernanceService()
    requests = governance.get_change_requests(loan_id, g.current_user)
    result = []
    for cr in requests:
        result.append(
            {
                "id": cr.id,
                "type": cr.type,
                "status": cr.status,
                "reason": cr.reason,
                "proposed_changes": cr.proposed_changes,
                "created_at": cr.created_at.isoformat() if cr.created_at else None,
                "resolved_at": cr.resolved_at.isoformat() if cr.resolved_at else None,
            }
        )
    return jsonify({"items": result}), HTTPStatus.OK


@loan_bp.route("/<loan_id>/change-requests", methods=["POST"])
@require_auth
def create_change_request(loan_id):
    data = request.get_json()
    governance = LoanGovernanceService()
    cr = governance.create_change_request(loan_id, data, g.current_user)
    return jsonify({"id": cr.id, "status": cr.status}), HTTPStatus.CREATED


@loan_bp.route("/<loan_id>/change-requests/<request_id>/approve", methods=["POST"])
@require_auth
def approve_change_request(loan_id, request_id):
    governance = LoanGovernanceService()
    cr = governance.approve_change_request(loan_id, request_id, g.current_user)
    return jsonify({"id": cr.id, "status": cr.status}), HTTPStatus.OK


@loan_bp.route("/<loan_id>/change-requests/<request_id>/reject", methods=["POST"])
@require_auth
def reject_change_request(loan_id, request_id):
    governance = LoanGovernanceService()
    cr = governance.reject_change_request(loan_id, request_id, g.current_user)
    return jsonify({"id": cr.id, "status": cr.status}), HTTPStatus.OK
