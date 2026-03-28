using LendQ.Application.DTOs.Users;

namespace LendQ.Application.DTOs.Auth;

public class AuthTokenResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public int ExpiresInSeconds { get; init; }
    public UserResponse User { get; init; } = null!;
}
