import logging

from flask import jsonify
from marshmallow import ValidationError as MarshmallowValidationError

from app.errors.exceptions import AppError

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = {"error": error.message, "code": error.code}
        if error.details:
            response["details"] = error.details
        return jsonify(response), error.status_code

    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow_error(error):
        return jsonify({
            "error": "Validation failed",
            "code": "VALIDATION_ERROR",
            "details": error.messages,
        }), 422

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({"error": "Not found", "code": "NOT_FOUND"}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return jsonify({"error": "Method not allowed", "code": "METHOD_NOT_ALLOWED"}), 405

    @app.errorhandler(429)
    def handle_rate_limit(error):
        return jsonify({
            "error": "Too many requests",
            "code": "RATE_LIMIT_EXCEEDED",
        }), 429

    @app.errorhandler(500)
    def handle_internal_error(error):
        logger.exception("Unhandled exception: %s", error)
        return jsonify({
            "error": "An unexpected error occurred",
            "code": "INTERNAL_ERROR",
        }), 500
