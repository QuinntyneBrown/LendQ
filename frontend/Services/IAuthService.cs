using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IAuthService
{
    string? AccessToken { get; }
    UserSummary? CurrentUser { get; }
    Task<UserSummary?> GetCurrentUserAsync();
    Task<AuthTokenBundle> LoginAsync(string email, string password);
    Task SignUpAsync(string name, string email, string password, string confirmPassword);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(string token, string password, string confirmPassword);
    Task<bool> RefreshAsync();
    Task LogoutAsync();
    Task ResendVerificationAsync(string email);
    Task ConfirmEmailAsync(string token);
    event Action? OnChange;
}
