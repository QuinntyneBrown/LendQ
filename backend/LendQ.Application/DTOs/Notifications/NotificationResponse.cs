namespace LendQ.Application.DTOs.Notifications;

public class NotificationResponse
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
    public Guid? RelatedLoanId { get; init; }
}
