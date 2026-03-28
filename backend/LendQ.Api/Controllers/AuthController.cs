using LendQ.Api.Extensions;
using LendQ.Application.DTOs.Auth;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup(SignupRequest request)
    {
        await _authService.SignupAsync(request);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthTokenResponse>> Login(LoginRequest request)
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.LoginAsync(request, userAgent, ipAddress);

        SetRefreshCookie(result.RefreshToken!);
        return Ok(new AuthTokenResponse
        {
            AccessToken = result.AccessToken,
            ExpiresInSeconds = result.ExpiresInSeconds,
            User = result.User
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthTokenResponse>> Refresh()
    {
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized();

        var userAgent = Request.Headers.UserAgent.ToString();
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _authService.RefreshAsync(refreshToken, userAgent, ipAddress);

        SetRefreshCookie(result.RefreshToken!);
        return Ok(new AuthTokenResponse
        {
            AccessToken = result.AccessToken,
            ExpiresInSeconds = result.ExpiresInSeconds,
            User = result.User
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<Application.DTOs.Users.UserResponse>> GetMe()
    {
        var userId = User.GetUserId();
        var user = await _authService.GetMeAsync(userId);
        return Ok(user);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var sessionId = User.GetSessionId();
        if (sessionId.HasValue)
            await _authService.LogoutAsync(sessionId.Value);

        DeleteRefreshCookie();
        return NoContent();
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        var userId = User.GetUserId();
        var sessionId = User.GetSessionId();
        await _authService.LogoutAllAsync(userId, sessionId);

        return NoContent();
    }

    [Authorize]
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var userId = User.GetUserId();
        var currentSessionId = User.GetSessionId();
        var sessions = await _authService.GetSessionsAsync(userId, currentSessionId);
        return Ok(new { items = sessions });
    }

    [Authorize]
    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<IActionResult> RevokeSession(Guid sessionId)
    {
        await _authService.RevokeSessionAsync(sessionId);
        return NoContent();
    }

    [HttpPost("email-verification/resend")]
    public async Task<IActionResult> ResendVerification(ResendVerificationRequest request)
    {
        await _authService.ResendVerificationAsync(request.Email);
        return Accepted();
    }

    [HttpPost("email-verification/confirm")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest request)
    {
        await _authService.ConfirmEmailAsync(request.Token);
        return Ok();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request.Email);
        return Accepted();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        await _authService.ResetPasswordAsync(request);
        return Ok();
    }

    private void SetRefreshCookie(string token)
    {
        Response.Cookies.Append("refresh_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/v1/auth",
            MaxAge = TimeSpan.FromDays(30)
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete("refresh_token", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/v1/auth"
        });
    }
}
