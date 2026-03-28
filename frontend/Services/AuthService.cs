using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class AuthService : IAuthService
{
    private readonly HttpClient _http;

    public AuthService(HttpClient http)
    {
        _http = http;
    }

    public string? AccessToken { get; private set; }
    public UserSummary? CurrentUser { get; private set; }
    public event Action? OnChange;

    public async Task<AuthTokenBundle> LoginAsync(string email, string password)
    {
        var response = await _http.PostAsJsonAsync("auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var bundle = await response.Content.ReadFromJsonAsync<AuthTokenBundle>()
            ?? throw new InvalidOperationException("Login response was null.");
        AccessToken = bundle.AccessToken;
        CurrentUser = bundle.User;
        OnChange?.Invoke();
        return bundle;
    }

    public async Task SignUpAsync(string name, string email, string password, string confirmPassword)
    {
        var response = await _http.PostAsJsonAsync("auth/signup", new
        {
            name,
            email,
            password,
            confirm_password = confirmPassword
        });
        response.EnsureSuccessStatusCode();
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var response = await _http.PostAsJsonAsync("auth/forgot-password", new { email });
        response.EnsureSuccessStatusCode();
    }

    public async Task ResetPasswordAsync(string token, string password, string confirmPassword)
    {
        var response = await _http.PostAsJsonAsync("auth/reset-password", new
        {
            token,
            password,
            confirm_password = confirmPassword
        });
        response.EnsureSuccessStatusCode();
    }

    public async Task<bool> RefreshAsync()
    {
        try
        {
            var response = await _http.PostAsync("auth/refresh", null);
            if (!response.IsSuccessStatusCode)
                return false;

            var bundle = await response.Content.ReadFromJsonAsync<AuthTokenBundle>();
            if (bundle is null)
                return false;

            AccessToken = bundle.AccessToken;
            CurrentUser = bundle.User;
            OnChange?.Invoke();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<UserSummary?> GetCurrentUserAsync()
    {
        if (CurrentUser is not null)
            return CurrentUser;

        var refreshed = await RefreshAsync();
        if (!refreshed)
            return null;

        return CurrentUser;
    }

    public async Task LogoutAsync()
    {
        try
        {
            await _http.PostAsync("auth/logout", null);
        }
        finally
        {
            AccessToken = null;
            CurrentUser = null;
            OnChange?.Invoke();
        }
    }

    public async Task ResendVerificationAsync(string email)
    {
        var response = await _http.PostAsJsonAsync("auth/resend-verification", new { email });
        response.EnsureSuccessStatusCode();
    }

    public async Task ConfirmEmailAsync(string token)
    {
        var response = await _http.PostAsJsonAsync("auth/confirm-email", new { token });
        response.EnsureSuccessStatusCode();
    }
}
