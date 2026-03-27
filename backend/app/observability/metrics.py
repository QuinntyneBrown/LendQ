import logging
import time

from flask import g, request

logger = logging.getLogger(__name__)


def init_metrics(app):
    @app.before_request
    def start_timer():
        g.start_time = time.time()

    @app.after_request
    def log_request(response):
        duration_ms = (time.time() - getattr(g, "start_time", time.time())) * 1000
        logger.info(
            "request",
            extra={
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "request_id": getattr(g, "request_id", None),
                "user_id": getattr(g, "current_user", None) and g.current_user.id,
            },
        )
        return response
