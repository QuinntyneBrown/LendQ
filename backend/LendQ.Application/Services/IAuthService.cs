using LendQ.Application.DTOs.Auth;
using LendQ.Application.DTOs.Users;

namespace LendQ.Application.Services;

public class AuthResult
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresInSeconds { get; set; }
    public UserResponse User { get; set; } = null!;
    public string? RefreshToken { get; set; }
}

public interface IAuthService
{
    Task SignupAsync(SignupRequest request);
    Task<AuthResult> LoginAsync(LoginRequest request, string? userAgent, string? ipAddress);
    Task<AuthResult> RefreshAsync(string refreshToken, string? userAgent, string? ipAddress);
    Task LogoutAsync(Guid sessionId);
    Task LogoutAllAsync(Guid userId, Guid? currentSessionId);
    Task<UserResponse> GetMeAsync(Guid userId);
    Task<List<SessionResponse>> GetSessionsAsync(Guid userId, Guid? currentSessionId);
    Task RevokeSessionAsync(Guid sessionId);
    Task ResendVerificationAsync(string email);
    Task ConfirmEmailAsync(string token);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(ResetPasswordRequest request);
}
