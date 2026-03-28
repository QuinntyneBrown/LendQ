import logging

from flask import g, jsonify
from marshmallow import ValidationError as MarshmallowValidationError

from app.errors.exceptions import AppError

logger = logging.getLogger(__name__)


def _error_response(code, message, status_code, details=None):
    body = {
        "code": code,
        "message": message,
        "request_id": getattr(g, "request_id", None),
    }
    if details:
        body["details"] = details
    return jsonify(body), status_code


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        return _error_response(error.code, error.message, error.status_code, error.details)

    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_error(error):
        return _error_response("VALIDATION_ERROR", "Validation failed", 422, error.messages)

    @app.errorhandler(404)
    def handle_not_found(error):
        return _error_response("NOT_FOUND", "Not found", 404)

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return _error_response("METHOD_NOT_ALLOWED", "Method not allowed", 405)

    @app.errorhandler(429)
    def handle_rate_limit(error):
        return _error_response("RATE_LIMIT_EXCEEDED", "Too many requests", 429)

    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.exception("Unhandled exception: %s", error)
        return _error_response("INTERNAL_ERROR", "An unexpected error occurred", 500)
