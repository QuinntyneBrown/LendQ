# Timesketch Coding Conventions Review

Analysis of the [Timesketch](https://github.com/google/timesketch) Flask REST API codebase, with evaluation of each convention as a Python best practice and a recommendation on whether LendQ should adopt it.

**Reviewed**: 2026-03-28

---

## Contents

- [1. Project Structure](#1-project-structure)
- [2. API Endpoint Pattern](#2-api-endpoint-pattern)
- [3. Request Parsing and Validation](#3-request-parsing-and-validation)
- [4. Response Serialization](#4-response-serialization)
- [5. Models and ORM](#5-models-and-orm)
- [6. Database Session Management](#6-database-session-management)
- [7. Error Handling](#7-error-handling)
- [8. HTTP Status Code Constants](#8-http-status-code-constants)
- [9. Authentication and Authorization](#9-authentication-and-authorization)
- [10. Configuration](#10-configuration)
- [11. Docstrings](#11-docstrings)
- [12. Type Hints](#12-type-hints)
- [13. Logging](#13-logging)
- [14. Celery and Background Tasks](#14-celery-and-background-tasks)
- [15. Testing](#15-testing)
- [16. Linting and Formatting](#16-linting-and-formatting)
- [17. Import Ordering](#17-import-ordering)
- [18. CSRF Protection](#18-csrf-protection)
- [Summary Matrix](#summary-matrix)
- [Recommended Changes for LendQ](#recommended-changes-for-lendq)

---

## 1. Project Structure

### Timesketch convention

Flat structure under a single `timesketch/` package. Business logic lives in `lib/`, API endpoints in `api/v1/resources/`, models in `models/`, and traditional views in `views/`. Tests are colocated with source files using a `_test.py` suffix (e.g., `resources_test.py` next to `resources/`).

```
timesketch/
├── app.py
├── api/v1/resources/      # Endpoint handlers
├── models/                # ORM models
├── lib/                   # Business logic, utilities, tasks, errors
├── views/                 # Flask blueprints (auth, SPA)
└── migrations/
```

### Good practice?

**Mixed.** The flat `lib/` directory becomes a grab bag: errors, tasks, utilities, analyzers, datastores, and LLM integrations all share a single namespace. Colocated tests are a valid choice (popular in Go), but the Python ecosystem overwhelmingly favors a separate `tests/` directory, and tools like pytest expect that layout by default.

### LendQ comparison

LendQ uses a layered architecture with explicit directories for each concern: `controllers/`, `services/`, `repositories/`, `schemas/`, `middleware/`, `errors/`, `observability/`. Tests live in a dedicated `tests/` tree with `unit/`, `integration/`, and `security/` subdivisions.

### Recommendation

**Do not adopt.** LendQ's layered structure is clearer, more scalable, and better aligned with Python conventions. No change needed.

---

## 2. API Endpoint Pattern

### Timesketch convention

Uses **Flask-RESTful** class-based resources. Each endpoint group is a `Resource` subclass with `get()`, `post()`, `put()`, `delete()` methods. A central `routes.py` file maps every URL to its resource class.

```python
# timesketch/api/v1/resources/sketch.py
class SketchListResource(resources.ResourceMixin, Resource):
    @login_required
    def get(self):
        """Handles GET request to the resource."""
        ...

    @login_required
    def post(self):
        """Handles POST request to the resource."""
        ...

# timesketch/api/v1/routes.py  (241 routes mapped in one file)
V1_API_ROUTES = [
    (SketchListResource, "/sketches/"),
    (SketchResource, "/sketches/<int:sketch_id>/"),
    ...
]
```

### Good practice?

**Partially.** Class-based views group related HTTP methods together, which is a real organizational benefit. However, Flask-RESTful is effectively unmaintained (last meaningful release in 2021), and its `reqparse` module is officially deprecated. The central 241-route mapping file is a maintenance bottleneck. Flask's built-in `MethodView` achieves the same grouping without the external dependency.

### LendQ comparison

LendQ uses **Blueprint-scoped functions** with `@route` decorators. Each controller file owns its blueprint and URL prefix. This is the dominant pattern in the Flask ecosystem.

```python
# LendQ: backend/app/controllers/auth_controller.py
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

@auth_bp.route("/login", methods=["POST"])
@limiter.limit(...)
def login():
    ...
```

### Recommendation

**Do not adopt Flask-RESTful.** LendQ's blueprint-per-controller approach is more maintainable and avoids a deprecated dependency. If endpoint files grow large, LendQ could consider Flask's built-in `MethodView` to group CRUD methods for a single resource, but this is optional and cosmetic.

---

## 3. Request Parsing and Validation

### Timesketch convention

Uses `flask_restful.reqparse.RequestParser` for input parsing and type coercion. Parsers are defined in `__init__` and arguments extracted in handlers.

```python
def __init__(self):
    super().__init__()
    self.parser = reqparse.RequestParser()
    self.parser.add_argument("scope", type=str, required=False, default="user", location="args")
    self.parser.add_argument("page", type=int, required=False, default=1, location="args")

def get(self):
    args = self.parser.parse_args()
```

For POST/PUT bodies, Timesketch also falls back to raw `request.json` dict access:

```python
form = request.json
if not form:
    form = request.data
username = form.get("username", "")
```

### Good practice?

**No.** `reqparse` is deprecated by its own maintainers. Raw `request.json` dict access provides no validation, no type coercion, and no error messages. This is a known weak point in Timesketch's codebase.

### LendQ comparison

LendQ uses **Marshmallow schemas** for both input validation and output serialization. Input schemas define required fields, type constraints, and validation rules. `schema.load()` raises a `ValidationError` with structured field-level messages on failure.

```python
class CreateUserRequestSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=255))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))

# In controller:
data = create_user_schema.load(request.get_json())
```

### Recommendation

**Do not adopt.** LendQ's Marshmallow-based validation is the modern standard and is strictly superior to Timesketch's approach.

---

## 4. Response Serialization

### Timesketch convention

Uses Flask-RESTful's `marshal()` with field definition dictionaries via a `ResourceMixin`. Every response follows a uniform envelope: `{"meta": {...}, "objects": [...]}`.

```python
class ResourceMixin:
    user_fields = {
        "id": fields.Integer,
        "username": fields.String,
        "name": fields.String,
    }

    def to_json(self, model, model_fields=None, meta=None, status_code=200):
        schema = {"meta": meta, "objects": []}
        if model:
            schema["objects"] = [marshal(model, model_fields)]
        response = jsonify(schema)
        response.status_code = status_code
        return response
```

### Good practice?

**Mixed.** A consistent response envelope is good practice. However, `marshal()` field definitions lack the expressiveness of Marshmallow (no validation, no nested loading, no custom serialization hooks). Wrapping single objects in an `"objects"` array is unusual and can confuse API consumers who expect a detail endpoint to return an object, not a list.

### LendQ comparison

LendQ uses Marshmallow `dump()` for output, with a `paginated_response()` helper for list endpoints. The pagination envelope (`items`, `total`, `page`, `per_page`, `pages`) follows widely-adopted conventions. Single-object responses return the object directly.

### Recommendation

**Do not adopt `marshal()` or the `objects` envelope.** LendQ's Marshmallow serialization is more capable. However, one idea worth considering from Timesketch is the **single `ResourceMixin` that centralizes response formatting**. LendQ could introduce a thin helper or base class for controllers to standardize single-object responses if consistency ever becomes an issue. This is low priority.

---

## 5. Models and ORM

### Timesketch convention

Uses a **declarative base class** (`BaseModel`) with `@as_declarative()` that provides:

- Auto-generated `__tablename__` (lowercase class name)
- Common columns: `id` (Integer), `created_at`, `updated_at`
- Class-level utility methods: `get_by_id()`, `get_or_create()`, `get_with_acl()`
- Rich **mixin composition** for cross-cutting concerns:

```python
@as_declarative()
class BaseModel:
    @declared_attr
    def __tablename__(self):
        return self.__name__.lower()

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime(), default=func.now())
    updated_at = Column(DateTime(), default=func.now(), onupdate=func.now())

    @classmethod
    def get_by_id(cls, model_id):
        return db_session.get(cls, model_id)

    @classmethod
    def get_or_create(cls, **kwargs):
        ...

class Sketch(AccessControlMixin, LabelMixin, StatusMixin, CommentMixin, BaseModel):
    ...
```

The `AccessControlMixin` dynamically generates per-model ACL tables and provides `has_permission()`, `grant_permission()`, and `revoke_permission()` methods directly on model instances.

### Good practice?

**Partially.** A base model with common columns (`id`, `created_at`, `updated_at`) is a well-established pattern that eliminates repetition and enforces consistency. The mixin composition for cross-cutting concerns (labels, comments, status tracking) is a clean use of Python's MRO.

However, putting query methods like `get_by_id()` and `get_or_create()` directly on the model **mixes data-access logic with the domain model**, violating separation of concerns. This makes models harder to test in isolation and tightly couples them to the database session.

### LendQ comparison

LendQ has no shared base model. Every model independently defines `id` (UUID string), `created_at`, and `updated_at` with identical column definitions repeated across files. Query logic is cleanly separated into the repository layer.

```python
# Repeated in every model:
id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
```

### Recommendation

**Partially adopt.** LendQ should introduce a `TimestampMixin` (or a lightweight `BaseModel`) to eliminate the repeated column definitions, without adding query methods to the model layer. This preserves LendQ's clean repository separation while reducing boilerplate.

```python
# Suggested addition:
class TimestampMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

class UUIDMixin:
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

class User(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = "users"
    name = db.Column(db.String(255), nullable=False)
    ...
```

Do **not** adopt the query-on-model pattern (`get_by_id`, `get_or_create`). LendQ's repository layer handles this better.

---

## 6. Database Session Management

### Timesketch convention

Uses a **module-level scoped session** (`db_session`) imported and used directly throughout the codebase: in models, resources, and library code. Commits happen wherever the developer decides they should.

```python
from timesketch.models import db_session

# In a resource handler:
db_session.add(sketch)
db_session.commit()

# In a model classmethod:
db_session.add(instance)
db_session.commit()
```

### Good practice?

**No.** Scattering `db_session.commit()` across models, resources, and utility functions makes transaction boundaries invisible. It becomes difficult to reason about what happens if step 3 of a 5-step operation fails: were steps 1 and 2 already committed? This pattern also makes unit testing harder because every layer has a hard dependency on the live session.

### LendQ comparison

LendQ enforces a clear convention: **repositories `flush()`, services `commit()`**. Repositories call `db.session.flush()` to write pending changes to the database within the current transaction, while services own the `commit()` call at the end of a logical unit of work.

```python
# Repository: flush only
def create(self, entity):
    db.session.add(entity)
    db.session.flush()
    return entity

# Service: commit at transaction boundary
def create_user(self, data, actor_id=None):
    ...
    self.user_repo.create(user)
    self.audit_service.log(...)
    db.session.commit()
    return user
```

### Recommendation

**Do not adopt.** LendQ's flush/commit separation is a significant architectural advantage. It provides clear transaction boundaries, enables multi-step operations that roll back atomically on failure, and keeps data-access concerns out of the domain layer.

---

## 7. Error Handling

### Timesketch convention

Uses a mix of Flask's `abort()`, a custom `ApiHTTPError` exception, and registered error handlers. Error responses are simple JSON objects:

```python
# Method 1: Flask abort
abort(HTTP_STATUS_CODE_NOT_FOUND, "No sketch found with this ID.")

# Method 2: Custom exception
raise ApiHTTPError("Custom message", HTTP_STATUS_CODE_BAD_REQUEST)

# Response body:
{"message": "...", "status": 404}
```

### Good practice?

**Partially.** Having error handlers is correct. But the dual approach (`abort()` vs `ApiHTTPError`) introduces inconsistency. The response body lacks a machine-readable error code (only a human-readable message and the HTTP status repeated in the body), and there is no request ID for traceability.

### LendQ comparison

LendQ uses a **single exception hierarchy** rooted at `AppError`, with subclasses for each error category. Responses include a machine-readable `code`, a `message`, a `request_id`, and optional `details`.

```python
class AppError(Exception):
    status_code = 500
    code = "INTERNAL_ERROR"

class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"

# Response:
{"code": "NOT_FOUND", "message": "Loan not found", "request_id": "abc-123", "details": null}
```

### Recommendation

**Do not adopt.** LendQ's error handling is substantially better: single mechanism, structured error codes, request ID tracing, and field-level details for validation errors. No change needed.

---

## 8. HTTP Status Code Constants

### Timesketch convention

Defines named constants for all HTTP status codes in `lib/definitions.py` and uses them throughout the codebase:

```python
# timesketch/lib/definitions.py
HTTP_STATUS_CODE_OK = 200
HTTP_STATUS_CODE_CREATED = 201
HTTP_STATUS_CODE_BAD_REQUEST = 400
HTTP_STATUS_CODE_NOT_FOUND = 404

# Usage:
return self.to_json(sketch, status_code=HTTP_STATUS_CODE_OK)
abort(HTTP_STATUS_CODE_NOT_FOUND, "No sketch found.")
```

### Good practice?

**Yes, with a caveat.** Named constants are more readable than magic integers. However, Python's standard library already provides `http.HTTPStatus`, which is an enum with `.value`, `.phrase`, and `.description` attributes. There is no need to maintain a custom constants file.

### LendQ comparison

LendQ uses raw integer literals everywhere:

```python
return jsonify(token_response_schema.dump(token_bundle)), 200
return jsonify(user_schema.dump(user)), 201
```

### Recommendation

**Adopt the principle, but use the stdlib.** Replace magic integers with `http.HTTPStatus` members. This is a small change that improves readability at zero cost.

```python
from http import HTTPStatus

return jsonify(user_schema.dump(user)), HTTPStatus.CREATED
return jsonify(loan_schema.dump(loan)), HTTPStatus.OK
```

This also keeps the error hierarchy cleaner:

```python
class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    code = "NOT_FOUND"
```

---

## 9. Authentication and Authorization

### Timesketch convention

Uses **Flask-Login** for session-based authentication with the `@login_required` decorator on every endpoint. Supports multiple auth backends: local username/password, Google OIDC, Google Cloud IAP (JWT), and SSO via environment headers. Authorization is model-level via an `AccessControlMixin` that generates per-model ACL tables.

```python
@login_required
def post(self, sketch_id):
    sketch = Sketch.get_with_acl(sketch_id)
    if not sketch.has_permission(current_user, "write"):
        abort(HTTP_STATUS_CODE_FORBIDDEN, "...")
```

### Good practice?

**Yes, for its context.** Flask-Login is mature and well-suited for server-rendered or hybrid apps. The dynamic ACL system is powerful for collaborative multi-tenant apps where per-object permissions matter. However, it is heavyweight and tightly couples authorization to the model layer.

### LendQ comparison

LendQ uses **JWT-based auth** with custom middleware decorators (`@require_auth`, `@require_role`). Authorization is role-based (Admin, Creditor, Borrower) rather than per-object ACL. Session tracking is explicit via an `AuthSession` model.

```python
@loan_bp.route("/<loan_id>", methods=["GET"])
@require_auth
def get_loan(loan_id):
    ...
```

### Recommendation

**Do not adopt.** LendQ's JWT + RBAC approach is correct for a SPA with a stateless API backend. Flask-Login's session-based model would require rearchitecting the frontend auth flow. The per-object ACL system is overkill for LendQ's role-based access model where a creditor owns their loans and borrowers see only their own.

---

## 10. Configuration

### Timesketch convention

Loads configuration from a **Python file on disk** (e.g., `/etc/timesketch/timesketch.conf`), referenced by the `TIMESKETCH_SETTINGS` environment variable. Supports additional overrides via prefixed environment variables (`TIMESKETCH_*`). No class hierarchy — all config is flat key-value.

```python
app.config.from_envvar("TIMESKETCH_SETTINGS")
app.config.from_prefixed_env()  # TIMESKETCH_SECRET_KEY → SECRET_KEY
```

### Good practice?

**Acceptable for ops-heavy deployments** (sysadmin edits a config file on the server), but not the modern standard. A flat namespace without per-environment classes means defaults, dev overrides, and production guards all live in the same file or are managed externally. The `from_prefixed_env()` feature (Flask 2.2+) is a nice addition for container deployments.

### LendQ comparison

LendQ uses **class-based config** with a base `Config` and per-environment subclasses (`DevelopmentConfig`, `TestingConfig`, `ProductionConfig`). Production enforces required secrets at init. Selection is via `FLASK_ENV`.

### Recommendation

**Do not adopt Timesketch's file-based config.** LendQ's class hierarchy is cleaner. However, one thing worth adopting from Timesketch is `app.config.from_prefixed_env()` as a supplementary config source. This allows ops to override any config value via environment variables without code changes — useful in containerized deployments.

```python
# Suggested addition in create_app():
app.config.from_object(config_by_name[config_name])
app.config.from_prefixed_env("LENDQ")  # LENDQ_LOG_LEVEL=DEBUG overrides LOG_LEVEL
```

---

## 11. Docstrings

### Timesketch convention

Uses **Google-style docstrings** with `Args`, `Returns`, and `Raises` sections. Applied consistently on public methods, resource handlers, and utility functions.

```python
def to_json(
    self,
    model: object,
    model_fields: Optional[Dict] = None,
    meta: Optional[Dict] = None,
    status_code: int = HTTP_STATUS_CODE_OK,
):
    """Create json response from a database model.

    Args:
        model: Instance of a timesketch database model.
        model_fields: Dictionary describing the resulting schema.
        meta: Dictionary holding any metadata for the result.
        status_code: Integer used as status_code in the response.

    Returns:
        Response in json format (instance of flask.wrappers.Response).
    """
```

### Good practice?

**Yes.** Google-style docstrings are one of the two most widely adopted conventions in the Python ecosystem (alongside NumPy-style). They are supported by Sphinx, pdoc, mkdocstrings, and most IDE tooling. Structured `Args`/`Returns`/`Raises` sections make function contracts explicit and machine-parseable.

### LendQ comparison

LendQ has minimal, inconsistent docstrings. Most functions have a one-line summary or no docstring at all. Service methods that implement core business logic (loan creation, payment recording) lack documentation of their parameters and return types.

### Recommendation

**Adopt.** LendQ should standardize on Google-style docstrings for all public methods in the service, repository, and controller layers. This is especially important for `services/` where the business rules live — a docstring on `LoanService.create_loan()` that documents its parameters, return type, and raised exceptions acts as an inline contract.

Priority: service layer first, then controllers, then repositories. Internal helper functions (`_set_session_cookie`) do not need full docstrings.

---

## 12. Type Hints

### Timesketch convention

Partial type hints on function signatures. Used more consistently in newer code and in the mixin/resource base classes, but absent in many older resource handlers and utility functions.

```python
def post(self, sketch_id: int):
    ...

@classmethod
def get_with_acl(cls, model_id, user=current_user, include_deleted=False) -> BaseModel:
    ...
```

### Good practice?

**Partially.** Type hints are a clear best practice for modern Python (PEP 484+). Timesketch applies them inconsistently, which means tooling like `mypy` or `pyright` cannot provide reliable checking. Partial adoption is better than none, but the real value comes from consistent coverage with a type checker in CI.

### LendQ comparison

LendQ also has minimal type hints. Function signatures and return types are largely untyped.

### Recommendation

**Adopt gradually.** Both codebases are weak here. LendQ should begin adding type hints to:

1. **Service method signatures** (parameters and return types) — highest value, documents the public API
2. **Repository methods** — clarifies what goes in and comes out of data access
3. **Controller handler signatures** — less critical since Flask handles routing types

Adding `mypy` or `pyright` to CI would enforce this going forward. Start with `--strict` on new files and `--ignore-missing-imports` for gradual adoption.

---

## 13. Logging

### Timesketch convention

Module-level loggers with **project-scoped names** (e.g., `timesketch.sketch_api`, `timesketch.tasks`). A custom `JSONLogFormatter` class for structured logging in cloud/Kubernetes environments, toggled by the `ENABLE_STRUCTURED_LOGGING` config flag.

```python
logger = logging.getLogger("timesketch.sketch_api")

# Custom JSON formatter:
class JSONLogFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "message": record.getMessage(),
            "severity": std_level,
            "timestamp": self.formatTime(record, self.datefmt),
            "logger": record.name,
            "pid": record.process,
            "module": record.module,
        }
        return json.dumps(log_record, default=str)
```

### Good practice?

**Partially.** Structured JSON logging is essential for production observability. However, writing a custom JSON formatter is unnecessary — the `python-json-logger` package handles this with less code and better edge-case handling.

### LendQ comparison

LendQ uses `logging.getLogger(__name__)` (the standard Python convention), `python-json-logger` for JSON formatting, and enriches request logs with `extra` fields (method, path, status_code, duration_ms, request_id, user_id).

### Recommendation

**Do not adopt.** LendQ's logging approach is already more modern: `__name__`-based loggers, a maintained library for JSON formatting, and richer structured fields. Timesketch's custom formatter is a pattern to avoid.

---

## 14. Celery and Background Tasks

### Timesketch convention

A `create_celery_app()` factory function separate from the Flask app factory. Flask app context is injected via a custom `ContextTask` base class. Tasks include **Prometheus metrics** for monitoring (counters for runs, errors, durations).

```python
# Prometheus metrics on tasks:
METRICS = {
    "worker_csv_jsonl_runs": prometheus_client.Counter(
        "worker_csv_jsonl_runs",
        "Number of times run_csv_jsonl has been run",
        namespace=METRICS_NAMESPACE,
    ),
}

@celery.task
def run_csv_jsonl(...):
    METRICS["worker_csv_jsonl_runs"].inc()
    ...
```

### Good practice?

**Yes.** The `ContextTask` pattern is the standard way to give Celery tasks Flask app context. Prometheus metrics on workers is a valuable practice for production observability: queue depth, task success/failure rates, and processing duration are critical for capacity planning and alerting.

### LendQ comparison

LendQ uses the same `ContextTask` pattern in `make_celery()`. Tasks use `bind=True, max_retries=3, default_retry_delay=60` for retry logic. No Prometheus or custom metrics on tasks.

### Recommendation

**Partially adopt.** LendQ's retry configuration is already good. Consider adding **task-level metrics** as the system approaches production. This could be Prometheus counters (as Timesketch does) or structured log events that Azure Monitor can query — the latter is simpler for a team not already running Prometheus. The specific pattern of incrementing counters for task starts, successes, and failures is worth adopting.

---

## 15. Testing

### Timesketch convention

Tests are colocated with source files (`*_test.py`). A `BaseTest` class extending `flask_testing.TestCase` provides shared setup/teardown, test client, and login helpers. Mock objects are defined for external services (OpenSearch). Test methods follow `test_<action>_<resource>` naming.

```python
class SketchListResourceTest(BaseTest):
    resource_url = "/api/v1/sketches/"

    def test_sketch_list_resource(self):
        self.login()
        response = self.client.get(self.resource_url)
        self.assertEqual(len(response.json["objects"]), 2)
        self.assert200(response)
```

### Good practice?

**Partially.** The `BaseTest` class with login helpers and mock datastores provides a productive test authoring experience. However, `flask_testing.TestCase` is deprecated in favor of pytest. `assertEqual`/`assert200` are unittest-style assertions that pytest's plain `assert` supersedes with better error messages. Colocated tests are a legitimate choice but uncommon in Python.

### LendQ comparison

LendQ uses **pytest natively** with `conftest.py` fixtures, factory classes for test data, scoped app/db fixtures, and an `assert_error_response` helper. Tests are organized by type (`unit/`, `integration/`, `security/`).

```python
@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    ...

class UserFactory:
    @staticmethod
    def create(name="Test User", email=None, role_name="Borrower", ...):
        ...
```

### Recommendation

**Do not adopt.** LendQ's testing approach is more modern and better organized. The factory pattern is superior to Timesketch's manual test data setup. The only useful idea from Timesketch is defining `resource_url` as a class attribute on test classes for DRY endpoint testing — a minor stylistic point that LendQ could optionally adopt.

---

## 16. Linting and Formatting

### Timesketch convention

Uses **Pylint** exclusively with a large `.pylintrc` config file (~23KB). No auto-formatter (no Black, no Ruff format). Inline `# pylint: disable=...` directives appear frequently.

### Good practice?

**Outdated.** Pylint is thorough but slow, noisy, and requires extensive configuration to avoid false positives. The Python ecosystem has largely moved to **Ruff** (which replaces Pylint, Flake8, isort, and more) for linting and **Ruff format** or **Black** for formatting. Inline disable directives scattered through the code are a code smell that suggests the tool is fighting the codebase rather than helping it.

### LendQ comparison

LendQ uses **Ruff** for linting with a concise `pyproject.toml` config. No auto-formatter is explicitly configured.

```toml
[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]
```

### Recommendation

**Do not adopt Pylint.** LendQ's Ruff-based setup is the modern choice. One improvement LendQ should consider is enabling **Ruff's formatter** (`ruff format`) to enforce consistent code style automatically. Adding `ruff format --check` to CI ensures formatting never drifts.

---

## 17. Import Ordering

### Timesketch convention

Standard Python convention: stdlib first, third-party second, local imports third. No explicit tool enforcement observed (no isort or Ruff isort rules).

### Good practice?

**Yes for the ordering, no for the lack of enforcement.** PEP 8 specifies this ordering. Without tooling, it drifts over time.

### LendQ comparison

LendQ's Ruff config includes `"I"` (isort rules), which enforces import ordering automatically.

### Recommendation

**Already adopted.** LendQ is ahead here with automated enforcement.

---

## 18. CSRF Protection

### Timesketch convention

Uses **Flask-WTF's `CSRFProtect`** globally, which automatically validates CSRF tokens on all state-changing requests for session-based auth.

```python
CSRFProtect(app)
```

### Good practice?

**Yes, for session-based auth.** Global CSRF protection is correct when the app uses cookies for authentication.

### LendQ comparison

LendQ uses a **custom per-endpoint `@require_csrf` decorator** that validates an `X-CSRF-Token` header against the current session. Applied manually on endpoints that need it.

### Recommendation

**Do not adopt.** Timesketch's global CSRF approach is designed for cookie-based sessions. LendQ's JWT-based auth means most requests are authenticated via `Authorization: Bearer` headers, which are not vulnerable to CSRF. LendQ's targeted decorator approach for session-cookie-authenticated endpoints is the correct design for its architecture.

---

## Summary Matrix

| Convention | Timesketch approach | Good practice? | LendQ current state | Adopt in LendQ? |
|---|---|---|---|---|
| Project structure | Flat `lib/`, colocated tests | Mixed | Layered architecture, separate tests | **No** |
| API endpoints | Flask-RESTful class resources | Partially (dep. deprecated) | Blueprint functions | **No** |
| Request validation | `reqparse` + raw `request.json` | No | Marshmallow schemas | **No** |
| Response serialization | `marshal()` + `objects` envelope | Mixed | Marshmallow `dump()` | **No** |
| Base model / mixins | `BaseModel` with common cols + methods | Partially | No base model, repeated cols | **Yes (mixins only)** |
| DB session management | Module-level `db_session`, commit anywhere | No | Repo flush / service commit | **No** |
| Error handling | `abort()` + `ApiHTTPError` | Partially | `AppError` hierarchy with codes | **No** |
| HTTP status constants | Custom constants file | Yes (principle) | Raw integers | **Yes (use stdlib)** |
| Auth/authz | Flask-Login + model ACL | Yes (for its context) | JWT + RBAC decorators | **No** |
| Configuration | File-based, flat | Acceptable | Class hierarchy | **No (minor addition)** |
| Docstrings | Google-style with Args/Returns | Yes | Minimal/inconsistent | **Yes** |
| Type hints | Partial | Partially | Minimal | **Yes** |
| Logging | Custom JSON formatter | Partially | python-json-logger + extra fields | **No** |
| Celery | ContextTask + Prometheus metrics | Yes | ContextTask + retry config | **Partially (metrics)** |
| Testing | BaseTest class, unittest-style | Partially | pytest, fixtures, factories | **No** |
| Linting | Pylint only | Outdated | Ruff | **No** |
| Import ordering | No enforcement | No | Ruff "I" rule enforced | **No** |
| CSRF | Global CSRFProtect | Yes (for session auth) | Per-endpoint decorator | **No** |

---

## Recommended Changes for LendQ

Ranked by impact and effort.

### 1. Introduce model mixins for common columns

**Effort**: Low | **Impact**: Medium

Create `UUIDMixin` and `TimestampMixin` in a new `backend/app/models/base.py`. Apply to all existing models. This eliminates ~6 repeated lines per model and ensures timestamp behavior is consistent.

### 2. Use `http.HTTPStatus` instead of integer literals

**Effort**: Low | **Impact**: Low-Medium

Replace magic integers (`200`, `201`, `404`) with `HTTPStatus.OK`, `HTTPStatus.CREATED`, `HTTPStatus.NOT_FOUND` across controllers and the error class hierarchy. A project-wide find-and-replace with review.

### 3. Standardize on Google-style docstrings

**Effort**: Medium | **Impact**: Medium

Add Google-style docstrings to all public methods in `services/`, `repositories/`, and `controllers/`. Prioritize services since they encode business rules. This is a gradual effort — apply to new and modified code first, then backfill during refactoring.

### 4. Add type hints to service and repository signatures

**Effort**: Medium | **Impact**: Medium

Type the public API of the service and repository layers. Add `mypy` or `pyright` to CI in non-strict mode initially. This catches bugs at development time and serves as living documentation.

### 5. Enable Ruff formatter

**Effort**: Low | **Impact**: Low

Add `ruff format --check` to CI. Run `ruff format` once to normalize the codebase. This prevents style debates in code review and keeps diffs clean.

### 6. Add `from_prefixed_env()` for config overrides

**Effort**: Low | **Impact**: Low

One line in `create_app()`. Allows any config value to be overridden via `LENDQ_*` environment variables in containerized deployments without modifying config classes.

### 7. Add task-level observability metrics

**Effort**: Medium | **Impact**: Medium (at production scale)

Instrument Celery tasks with structured log events or counters for task starts, completions, failures, and durations. This becomes critical when running background jobs in production (payment reminders, notifications, outbox processing).
