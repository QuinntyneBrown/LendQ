import logging
from datetime import UTC, datetime

from app.celery_app import celery
from app.extensions import db
from app.models.notification import Notification
from app.models.notification_delivery import DeliveryChannel, DeliveryStatus, NotificationDelivery
from app.models.outbox_event import OutboxEvent

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def process_outbox_events(self):
    """Process unpublished outbox events."""
    events = (
        OutboxEvent.query.filter(OutboxEvent.published_at.is_(None))
        .order_by(OutboxEvent.created_at.asc())
        .limit(100)
        .all()
    )

    for event in events:
        try:
            if event.event_type.startswith("notification."):
                _materialize_notification(event)
            event.published_at = datetime.now(UTC)
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.exception("Failed to process outbox event %s: %s", event.id, exc)
            raise self.retry(exc=exc)


@celery.task(bind=True, max_retries=3, default_retry_delay=30)
def send_notification_email(self, notification_id):
    """Send email for a notification if user preferences allow it."""
    from app.models.notification_preference import NotificationPreference
    from app.services.email_service import EmailService

    notification = Notification.query.get(notification_id)
    if not notification:
        return

    # Check user preference
    pref = NotificationPreference.query.get(notification.user_id)
    type_to_pref = {
        "PAYMENT_DUE": "payment_due_email",
        "PAYMENT_OVERDUE": "payment_overdue_email",
        "PAYMENT_RECEIVED": "payment_received_email",
        "SCHEDULE_CHANGED": "schedule_changed_email",
        "LOAN_MODIFIED": "loan_modified_email",
        "SYSTEM": "system_email",
    }

    pref_field = type_to_pref.get(notification.type)
    if pref and pref_field and not getattr(pref, pref_field, True):
        # User opted out
        delivery = NotificationDelivery(
            notification_id=notification_id,
            channel=DeliveryChannel.EMAIL,
            status=DeliveryStatus.SKIPPED,
        )
        db.session.add(delivery)
        db.session.commit()
        return

    # Send email
    delivery = NotificationDelivery(
        notification_id=notification_id,
        channel=DeliveryChannel.EMAIL,
        status=DeliveryStatus.PENDING,
    )
    db.session.add(delivery)
    db.session.flush()

    try:
        email_service = EmailService()
        user = notification.user
        email_service.send_email(
            to=user.email,
            subject=notification.title or "LendQ Notification",
            body=notification.body or notification.message or "",
        )
        delivery.status = DeliveryStatus.SENT
        delivery.attempt_count = 1
        delivery.last_attempt_at = datetime.now(UTC)
    except Exception as exc:
        delivery.status = DeliveryStatus.FAILED
        delivery.attempt_count = 1
        delivery.last_attempt_at = datetime.now(UTC)
        db.session.commit()
        logger.exception("Failed to send notification email %s: %s", notification_id, exc)
        raise self.retry(exc=exc)

    db.session.commit()


def _materialize_notification(event):
    """Create a Notification from an outbox event."""
    payload = event.payload or {}
    notification = Notification(
        user_id=payload.get("user_id"),
        type=payload.get("type", "SYSTEM"),
        title=payload.get("title"),
        body=payload.get("body"),
        message=payload.get("body"),
        loan_id=payload.get("loan_id"),
        related_loan_id=payload.get("loan_id"),
    )
    db.session.add(notification)
    db.session.flush()

    # Create in-app delivery record
    in_app_delivery = NotificationDelivery(
        notification_id=notification.id,
        channel=DeliveryChannel.IN_APP,
        status=DeliveryStatus.SENT,
        attempt_count=1,
        last_attempt_at=datetime.now(UTC),
    )
    db.session.add(in_app_delivery)

    # Queue email delivery
    send_notification_email.delay(notification.id)
