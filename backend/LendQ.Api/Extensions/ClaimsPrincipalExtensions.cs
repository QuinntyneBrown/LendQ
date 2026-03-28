using System.Security.Claims;

namespace LendQ.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID claim not found.");
        return Guid.Parse(claim.Value);
    }

    public static string GetEmail(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(ClaimTypes.Email)
            ?? throw new UnauthorizedAccessException("Email claim not found.");
        return claim.Value;
    }

    public static IEnumerable<string> GetRoles(this ClaimsPrincipal principal)
    {
        return principal.FindAll(ClaimTypes.Role).Select(c => c.Value);
    }

    public static Guid? GetSessionId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst("session_id");
        return claim != null ? Guid.Parse(claim.Value) : null;
    }
}
