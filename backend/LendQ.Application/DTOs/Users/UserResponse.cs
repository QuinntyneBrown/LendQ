namespace LendQ.Application.DTOs.Users;

public class UserResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public List<string> Roles { get; init; } = new();
    public string Status { get; init; } = string.Empty;
    public bool EmailVerified { get; init; }
}
