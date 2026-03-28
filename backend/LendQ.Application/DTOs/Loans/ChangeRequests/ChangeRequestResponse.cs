using LendQ.Application.DTOs.Users;

namespace LendQ.Application.DTOs.Loans.ChangeRequests;

public class ChangeRequestResponse
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public UserResponse RequestedBy { get; init; } = null!;
    public DateTime CreatedAt { get; init; }
    public string Reason { get; init; } = string.Empty;
    public Dictionary<string, object>? ProposedTerms { get; init; }
}
