using System.Security.Claims;
using LendQ.Client.Models;
using LendQ.Client.Services;
using Microsoft.AspNetCore.Components.Authorization;

namespace LendQ.Client.Auth;

public class CustomAuthStateProvider : AuthenticationStateProvider
{
    private readonly IAuthService _authService;

    public CustomAuthStateProvider(IAuthService authService)
    {
        _authService = authService;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            var user = await _authService.GetCurrentUserAsync();
            if (user is not null)
            {
                var principal = CreateClaimsPrincipal(user);
                return new AuthenticationState(principal);
            }
        }
        catch
        {
            // Fall through to anonymous
        }

        return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
    }

    public void NotifyUserAuthentication(UserSummary user)
    {
        var principal = CreateClaimsPrincipal(user);
        var task = Task.FromResult(new AuthenticationState(principal));
        NotifyAuthenticationStateChanged(task);
    }

    public void NotifyUserLogout()
    {
        var anonymous = new ClaimsPrincipal(new ClaimsIdentity());
        var task = Task.FromResult(new AuthenticationState(anonymous));
        NotifyAuthenticationStateChanged(task);
    }

    private static ClaimsPrincipal CreateClaimsPrincipal(UserSummary user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
        };

        foreach (var role in user.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var identity = new ClaimsIdentity(claims, "apiauth");
        return new ClaimsPrincipal(identity);
    }
}
