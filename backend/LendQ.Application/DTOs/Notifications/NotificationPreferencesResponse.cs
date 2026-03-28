namespace LendQ.Application.DTOs.Notifications;

public class NotificationPreferencesResponse
{
    public bool PaymentDueEmail { get; init; }
    public bool PaymentOverdueEmail { get; init; }
    public bool PaymentReceivedEmail { get; init; }
    public bool ScheduleChangedEmail { get; init; }
    public bool LoanModifiedEmail { get; init; }
    public bool SystemEmail { get; init; }
}
