from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.schemas.dashboard_schemas import (
    ActivityItemSchema,
    DashboardLoanSchema,
    DashboardSchema,
    DashboardSummarySchema,
)
from app.services.dashboard_service import DashboardService

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/v1/dashboard")

dashboard_schema = DashboardSchema()
summary_schema = DashboardSummarySchema()
loan_schema = DashboardLoanSchema()
activity_schema = ActivityItemSchema()


@dashboard_bp.route("/", methods=["GET"])
@require_auth
def get_dashboard():
    tab = request.args.get("tab", "creditor")
    dashboard_service = DashboardService()
    data = dashboard_service.get_full_dashboard(g.current_user, tab=tab)
    return jsonify(dashboard_schema.dump(data)), 200


@dashboard_bp.route("/summary", methods=["GET"])
@require_auth
def get_summary():
    dashboard_service = DashboardService()
    summary = dashboard_service.get_summary(g.current_user)
    return jsonify(summary_schema.dump(summary)), 200


@dashboard_bp.route("/loans", methods=["GET"])
@require_auth
def get_loans():
    tab = request.args.get("tab", "creditor")
    dashboard_service = DashboardService()
    loans = dashboard_service.get_loans(g.current_user, tab=tab)
    return jsonify(loan_schema.dump(loans, many=True)), 200


@dashboard_bp.route("/activity", methods=["GET"])
@require_auth
def get_activity():
    limit = request.args.get("limit", 20, type=int)
    dashboard_service = DashboardService()
    activity = dashboard_service.get_activity(g.current_user, limit=limit)
    return jsonify(activity_schema.dump(activity, many=True)), 200
