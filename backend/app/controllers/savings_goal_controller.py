from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.middleware.idempotency import require_idempotency
from app.schemas.pagination import paginated_response
from app.schemas.savings_goal_schemas import (
    ContributeSchema,
    CreateSavingsGoalSchema,
    ReleaseSchema,
    SavingsGoalEntrySchema,
    SavingsGoalSchema,
    UpdateSavingsGoalSchema,
)
from app.services.savings_goal_service import SavingsGoalService

savings_bp = Blueprint("savings", __name__, url_prefix="/api/v1/savings")

goal_schema = SavingsGoalSchema()
create_goal_schema = CreateSavingsGoalSchema()
update_goal_schema = UpdateSavingsGoalSchema()
contribute_schema = ContributeSchema()
release_schema = ReleaseSchema()
entry_schema = SavingsGoalEntrySchema()


@savings_bp.route("", methods=["GET"])
@require_auth
def list_goals():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = SavingsGoalService()
    result = service.list_goals(g.current_user, page, per_page)
    return jsonify(paginated_response(goal_schema, result)), HTTPStatus.OK


@savings_bp.route("", methods=["POST"])
@require_auth
def create_goal():
    data = create_goal_schema.load(request.get_json())
    service = SavingsGoalService()
    goal = service.create_goal(data, g.current_user)
    return jsonify(goal_schema.dump(goal)), HTTPStatus.CREATED


@savings_bp.route("/<goal_id>", methods=["GET"])
@require_auth
def get_goal(goal_id):
    service = SavingsGoalService()
    goal = service.get_goal(goal_id, g.current_user)
    return jsonify(goal_schema.dump(goal)), HTTPStatus.OK


@savings_bp.route("/<goal_id>", methods=["PATCH"])
@require_auth
def update_goal(goal_id):
    data = update_goal_schema.load(request.get_json())
    service = SavingsGoalService()
    goal = service.update_goal(goal_id, data, g.current_user)
    return jsonify(goal_schema.dump(goal)), HTTPStatus.OK


@savings_bp.route("/<goal_id>/cancel", methods=["POST"])
@require_auth
def cancel_goal(goal_id):
    service = SavingsGoalService()
    goal = service.cancel_goal(goal_id, g.current_user)
    return jsonify(goal_schema.dump(goal)), HTTPStatus.OK


@savings_bp.route("/<goal_id>/contributions", methods=["POST"])
@require_auth
@require_idempotency
def contribute(goal_id):
    data = contribute_schema.load(request.get_json())
    idempotency_key = request.headers.get("Idempotency-Key")
    service = SavingsGoalService()
    entry = service.contribute(goal_id, data, g.current_user, idempotency_key)
    return jsonify(entry_schema.dump(entry)), HTTPStatus.CREATED


@savings_bp.route("/<goal_id>/release", methods=["POST"])
@require_auth
@require_idempotency
def release(goal_id):
    data = release_schema.load(request.get_json())
    idempotency_key = request.headers.get("Idempotency-Key")
    service = SavingsGoalService()
    entry = service.release(goal_id, data, g.current_user, idempotency_key)
    return jsonify(entry_schema.dump(entry)), HTTPStatus.CREATED


@savings_bp.route("/<goal_id>/entries", methods=["GET"])
@require_auth
def list_entries(goal_id):
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    service = SavingsGoalService()
    result = service.list_entries(goal_id, g.current_user, page, per_page)
    return jsonify(paginated_response(entry_schema, result)), HTTPStatus.OK
