import os

from dotenv import load_dotenv
from flask import Flask

from app.config import config_by_name
from app.extensions import cors, db, limiter, ma, migrate


def create_app(config_name=None):
    load_dotenv()

    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config_by_name[config_name])
    app.config.from_prefixed_env("LENDQ")

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    cors.init_app(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    limiter.init_app(app)

    # Register middleware
    from app.middleware.request_id import init_request_id
    from app.middleware.security_headers import init_security_headers

    init_request_id(app)
    init_security_headers(app)

    # Register error handlers
    from app.errors.handlers import register_error_handlers

    register_error_handlers(app)

    # Register blueprints
    from app.controllers.admin_controller import admin_bp
    from app.controllers.auth_controller import auth_bp
    from app.controllers.dashboard_controller import dashboard_bp
    from app.controllers.loan_controller import loan_bp
    from app.controllers.notification_controller import notification_bp, pref_bp
    from app.controllers.payment_controller import payment_bp
    from app.controllers.role_controller import role_bp
    from app.controllers.user_controller import user_bp
    from app.observability.health import health_bp

    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(role_bp)
    app.register_blueprint(loan_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(pref_bp)
    app.register_blueprint(health_bp)

    # Initialize metrics
    from app.observability.metrics import init_metrics

    init_metrics(app)

    # Configure logging
    from app.observability.logging import configure_logging

    configure_logging(app)

    return app
