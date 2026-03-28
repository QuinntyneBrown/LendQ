using LendQ.Application.DTOs.Users;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetUsersAsync();
        return Ok(new { items = users });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
    {
        var user = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetById), new { userId = user.Id }, user);
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid userId)
    {
        var user = await _userService.GetByIdAsync(userId);
        return Ok(user);
    }

    [HttpPatch("{userId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> UpdateUser(Guid userId, UpdateUserRequest request)
    {
        var user = await _userService.UpdateUserAsync(userId, request);
        return Ok(user);
    }

    [HttpGet("borrowers")]
    public async Task<IActionResult> SearchBorrowers([FromQuery] string? search)
    {
        var borrowers = await _userService.SearchBorrowersAsync(search);
        return Ok(new { items = borrowers });
    }
}
