from app.extensions import limiter

auth_rate_limit = limiter.limit("5/minute")
