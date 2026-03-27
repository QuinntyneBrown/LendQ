from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.schemas.loan_schemas import CreateLoanRequestSchema, LoanSchema, UpdateLoanRequestSchema
from app.schemas.pagination import paginated_response
from app.services.loan_service import LoanService

loan_bp = Blueprint("loans", __name__, url_prefix="/api/v1/loans")

loan_schema = LoanSchema()
create_loan_schema = CreateLoanRequestSchema()
update_loan_schema = UpdateLoanRequestSchema()


@loan_bp.route("", methods=["GET"])
@require_auth
def list_loans():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    tab = request.args.get("tab")
    status = request.args.get("status")

    loan_service = LoanService()
    result = loan_service.list_loans(
        user=g.current_user, page=page, per_page=per_page, tab=tab, status=status
    )
    return jsonify(paginated_response(loan_schema, result)), 200


@loan_bp.route("/<loan_id>", methods=["GET"])
@require_auth
def get_loan(loan_id):
    loan_service = LoanService()
    loan = loan_service.get_loan(loan_id, g.current_user)
    return jsonify(loan_schema.dump(loan)), 200


@loan_bp.route("", methods=["POST"])
@require_auth
def create_loan():
    data = create_loan_schema.load(request.get_json())
    loan_service = LoanService()
    loan = loan_service.create_loan(data, g.current_user)
    return jsonify(loan_schema.dump(loan)), 201


@loan_bp.route("/<loan_id>", methods=["PUT"])
@require_auth
def update_loan(loan_id):
    data = update_loan_schema.load(request.get_json())
    loan_service = LoanService()
    loan = loan_service.update_loan(loan_id, data, g.current_user)
    return jsonify(loan_schema.dump(loan)), 200
