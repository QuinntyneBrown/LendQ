from app.models.payment import PaymentStatus


class TestPaymentModel:
    def test_payment_status_values(self):
        assert PaymentStatus.SCHEDULED == "SCHEDULED"
        assert PaymentStatus.PAID == "PAID"
        assert PaymentStatus.PARTIAL == "PARTIAL"
        assert PaymentStatus.RESCHEDULED == "RESCHEDULED"
        assert PaymentStatus.PAUSED == "PAUSED"
        assert PaymentStatus.OVERDUE == "OVERDUE"
