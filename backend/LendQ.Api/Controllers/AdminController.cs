using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AdminController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet("audit-events")]
    public async Task<IActionResult> GetAuditEvents(
        [FromQuery] string? eventType,
        [FromQuery] Guid? userId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var events = await _auditService.SearchEventsAsync(eventType, userId, from, to);
        return Ok(new { items = events });
    }
}
