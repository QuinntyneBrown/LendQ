namespace LendQ.Application.DTOs.Users;

public class SessionResponse
{
    public Guid Id { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime LastSeenAt { get; init; }
    public bool IsCurrent { get; init; }
    public string? UserAgent { get; init; }
    public string? IpAddress { get; init; }
}
