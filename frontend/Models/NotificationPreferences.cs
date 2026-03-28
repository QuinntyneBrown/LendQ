using System.Text.Json.Serialization;

namespace LendQ.Client.Models;

public class NotificationPreferences
{
    [JsonPropertyName("payment_due_email")]
    public bool PaymentDueEmail { get; set; }

    [JsonPropertyName("payment_overdue_email")]
    public bool PaymentOverdueEmail { get; set; }

    [JsonPropertyName("payment_received_email")]
    public bool PaymentReceivedEmail { get; set; }

    [JsonPropertyName("schedule_changed_email")]
    public bool ScheduleChangedEmail { get; set; }

    [JsonPropertyName("loan_modified_email")]
    public bool LoanModifiedEmail { get; set; }

    [JsonPropertyName("system_email")]
    public bool SystemEmail { get; set; }
}
