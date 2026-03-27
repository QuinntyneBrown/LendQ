from app.extensions import db


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), primary_key=True
    )
    notification_type = db.Column(db.String(30), primary_key=True)
    email_enabled = db.Column(db.Boolean, default=True, nullable=False)

    user = db.relationship("User")
