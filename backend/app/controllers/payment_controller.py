from http import HTTPStatus

from flask import Blueprint, g, jsonify, request

from app.middleware.auth_middleware import require_auth
from app.middleware.idempotency import require_idempotency
from app.schemas.notification_schemas import ChangeLogSchema
from app.schemas.payment_schemas import (
    PauseRequestSchema,
    PaymentSchema,
    RecordPaymentRequestSchema,
    RescheduleRequestSchema,
)
from app.services.payment_service import PaymentService

payment_bp = Blueprint("payments", __name__)

payment_schema = PaymentSchema()
record_payment_schema = RecordPaymentRequestSchema()
reschedule_schema = RescheduleRequestSchema()
pause_schema = PauseRequestSchema()
change_log_schema = ChangeLogSchema()


@payment_bp.route("/api/v1/loans/<loan_id>/schedule", methods=["GET"])
@require_auth
def get_schedule(loan_id):
    payment_service = PaymentService()
    schedule = payment_service.get_schedule(loan_id, g.current_user)
    return jsonify(payment_schema.dump(schedule, many=True)), HTTPStatus.OK


@payment_bp.route("/api/v1/loans/<loan_id>/payments", methods=["POST"])
@require_auth
@require_idempotency
def record_payment(loan_id):
    data = record_payment_schema.load(request.get_json())
    payment_service = PaymentService()
    payment_service.record_payment(loan_id, data, g.current_user)
    return jsonify({"message": "Payment recorded"}), HTTPStatus.CREATED


@payment_bp.route("/api/v1/payments/<payment_id>/reschedule", methods=["PUT"])
@require_auth
def reschedule_payment(payment_id):
    data = reschedule_schema.load(request.get_json())
    payment_service = PaymentService()
    payment_service.reschedule_payment(payment_id, data, g.current_user)
    return jsonify({"message": "Payment rescheduled"}), HTTPStatus.OK


@payment_bp.route("/api/v1/loans/<loan_id>/pause", methods=["POST"])
@require_auth
def pause_payments(loan_id):
    data = pause_schema.load(request.get_json())
    payment_service = PaymentService()
    payment_service.pause_payments(loan_id, data, g.current_user)
    return jsonify({"message": "Payments paused"}), HTTPStatus.OK


@payment_bp.route("/api/v1/loans/<loan_id>/history", methods=["GET"])
@require_auth
def get_history(loan_id):
    payment_service = PaymentService()
    history = payment_service.get_history(loan_id, g.current_user)
    return jsonify(change_log_schema.dump(history, many=True)), HTTPStatus.OK
