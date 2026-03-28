namespace LendQ.Application.DTOs.Dashboard;

public class ActivityItemResponse
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public Guid? LoanId { get; init; }
}
