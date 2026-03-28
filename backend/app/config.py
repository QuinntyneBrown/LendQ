import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    JWT_ALGORITHM = "HS256"

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "postgresql+psycopg2://lendq:lendq@localhost:5432/lendq_dev"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

    MAIL_HOST = os.environ.get("MAIL_HOST", "localhost")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "1025"))

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")

    LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
    LOG_FORMAT = os.environ.get("LOG_FORMAT", "json")

    RATELIMIT_DEFAULT = "200/hour"
    RATE_LIMIT_AUTH = "5/minute"


class DevelopmentConfig(Config):
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-not-for-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-not-for-production")
    RATELIMIT_DEFAULT = "10000/hour"
    RATE_LIMIT_AUTH = "500/minute"


class TestingConfig(Config):
    TESTING = True
    SECRET_KEY = "test-secret-key"
    JWT_SECRET_KEY = "test-jwt-secret-key"
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", "sqlite:///test.db")
    RATE_LIMIT_AUTH = "100/minute"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=60)


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 3,
        "max_overflow": 2,
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }

    def __init__(self):
        super().__init__()
        if not self.SECRET_KEY:
            raise RuntimeError("SECRET_KEY must be set in production")
        if not self.JWT_SECRET_KEY:
            raise RuntimeError("JWT_SECRET_KEY must be set in production")


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
