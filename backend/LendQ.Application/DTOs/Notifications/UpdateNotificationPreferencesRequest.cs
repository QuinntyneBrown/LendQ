namespace LendQ.Application.DTOs.Notifications;

public class UpdateNotificationPreferencesRequest
{
    public bool PaymentDueEmail { get; set; }
    public bool PaymentOverdueEmail { get; set; }
    public bool PaymentReceivedEmail { get; set; }
    public bool ScheduleChangedEmail { get; set; }
    public bool LoanModifiedEmail { get; set; }
    public bool SystemEmail { get; set; }
}
