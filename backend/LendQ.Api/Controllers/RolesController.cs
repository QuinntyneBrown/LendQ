using LendQ.Application.DTOs.Roles;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleService.GetRolesAsync();
        return Ok(new { items = roles });
    }

    [HttpPut("{roleKey}/permissions")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdatePermissions(string roleKey, UpdateRolePermissionsRequest request)
    {
        var role = await _roleService.UpdateRolePermissionsAsync(roleKey, request);
        return Ok(role);
    }
}
