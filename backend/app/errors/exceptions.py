class AppError(Exception):
    status_code = 500
    code = "INTERNAL_ERROR"

    def __init__(self, message="An unexpected error occurred", details=None):
        super().__init__(message)
        self.message = message
        self.details = details


class AuthenticationError(AppError):
    status_code = 401
    code = "AUTHENTICATION_ERROR"

    def __init__(self, message="Invalid credentials", details=None):
        super().__init__(message, details)


class AuthorizationError(AppError):
    status_code = 403
    code = "AUTHORIZATION_ERROR"

    def __init__(self, message="You do not have permission to perform this action", details=None):
        super().__init__(message, details)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"

    def __init__(self, message="Resource not found", details=None):
        super().__init__(message, details)


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"

    def __init__(self, message="Resource already exists", details=None):
        super().__init__(message, details)


class ValidationError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"

    def __init__(self, message="Validation failed", details=None):
        super().__init__(message, details)
