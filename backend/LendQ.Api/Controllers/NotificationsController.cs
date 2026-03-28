using LendQ.Api.Extensions;
using LendQ.Application.DTOs.Notifications;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = User.GetUserId();
        var notifications = await _notificationService.GetNotificationsAsync(userId);
        return Ok(new { items = notifications });
    }

    [HttpGet("notifications/unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = User.GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPost("notifications/{notificationId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid notificationId)
    {
        await _notificationService.MarkAsReadAsync(notificationId);
        return NoContent();
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = User.GetUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }

    [HttpGet("notifications/stream")]
    public async Task GetStream(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        while (!cancellationToken.IsCancellationRequested)
        {
            var count = await _notificationService.GetUnreadCountAsync(userId);
            await Response.WriteAsync($"data: {{\"unread_count\":{count}}}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
            await Task.Delay(TimeSpan.FromSeconds(30), cancellationToken);
        }
    }

    [HttpGet("notification-preferences")]
    public async Task<ActionResult<NotificationPreferencesResponse>> GetPreferences()
    {
        var userId = User.GetUserId();
        var prefs = await _notificationService.GetPreferencesAsync(userId);
        return Ok(prefs);
    }

    [HttpPut("notification-preferences")]
    public async Task<ActionResult<NotificationPreferencesResponse>> UpdatePreferences(
        UpdateNotificationPreferencesRequest request)
    {
        var userId = User.GetUserId();
        var prefs = await _notificationService.UpdatePreferencesAsync(userId, request);
        return Ok(prefs);
    }
}
