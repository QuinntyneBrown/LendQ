using LendQ.Api.Extensions;
using LendQ.Application.DTOs.Dashboard;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary()
    {
        var userId = User.GetUserId();
        var summary = await _dashboardService.GetSummaryAsync(userId);
        return Ok(summary);
    }

    [HttpGet("loans")]
    public async Task<IActionResult> GetLoans()
    {
        var userId = User.GetUserId();
        var loans = await _dashboardService.GetLoansAsync(userId);
        return Ok(new { items = loans });
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetActivity()
    {
        var userId = User.GetUserId();
        var activity = await _dashboardService.GetActivityAsync(userId);
        return Ok(new { items = activity });
    }
}
