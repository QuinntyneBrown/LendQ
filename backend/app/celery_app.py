import os

from celery import Celery


def make_celery(app=None):
    broker_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    celery = Celery(
        "lendq",
        broker=broker_url,
        backend=broker_url,
    )
    celery.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
    )

    if app:
        celery.conf.update(app.config)

        class ContextTask(celery.Task):
            def __call__(self, *args, **kwargs):
                with app.app_context():
                    return self.run(*args, **kwargs)

        celery.Task = ContextTask

    return celery


celery = make_celery()
