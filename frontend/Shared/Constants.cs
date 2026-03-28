namespace LendQ.Client.Shared;

public static class Constants
{
    public const string ApiBaseUrl = "http://localhost:5000/api/v1/";

    public static class LoanStatus
    {
        public const string Active = "ACTIVE";
        public const string Paused = "PAUSED";
        public const string PaidOff = "PAID_OFF";
        public const string Overdue = "OVERDUE";
        public const string Defaulted = "DEFAULTED";
    }

    public static class InstallmentStatus
    {
        public const string Scheduled = "SCHEDULED";
        public const string Partial = "PARTIAL";
        public const string Paid = "PAID";
        public const string Paused = "PAUSED";
        public const string Rescheduled = "RESCHEDULED";
        public const string OverdueStat = "OVERDUE";
    }

    public static class PaymentMethod
    {
        public const string Cash = "CASH";
        public const string BankTransfer = "BANK_TRANSFER";
        public const string Card = "CARD";
        public const string Other = "OTHER";
    }

    public static class TransactionType
    {
        public const string Payment = "PAYMENT";
        public const string Reversal = "REVERSAL";
        public const string Adjustment = "ADJUSTMENT";
    }

    public static class NotificationType
    {
        public const string PaymentDue = "PAYMENT_DUE";
        public const string PaymentOverdue = "PAYMENT_OVERDUE";
        public const string PaymentReceived = "PAYMENT_RECEIVED";
        public const string ScheduleChanged = "SCHEDULE_CHANGED";
        public const string LoanModified = "LOAN_MODIFIED";
        public const string System = "SYSTEM";
    }

    public static class Roles
    {
        public const string Admin = "ADMIN";
        public const string Creditor = "CREDITOR";
        public const string Borrower = "BORROWER";
    }

    public static class ChangeRequestType
    {
        public const string TermChange = "TERM_CHANGE";
        public const string Reschedule = "RESCHEDULE";
        public const string Pause = "PAUSE";
    }

    public static class ChangeRequestStatus
    {
        public const string Pending = "PENDING";
        public const string Approved = "APPROVED";
        public const string Rejected = "REJECTED";
    }

    public static readonly string[] AvailablePermissions =
    [
        "manage_users",
        "manage_roles",
        "create_loans",
        "edit_loans",
        "view_loans",
        "record_payments",
        "reverse_payments",
        "manage_schedule",
        "view_dashboard",
        "view_notifications"
    ];

    public static readonly string[] SupportedCurrencies = ["USD", "EUR", "GBP"];

    public static readonly string[] RepaymentFrequencies = ["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"];
}
