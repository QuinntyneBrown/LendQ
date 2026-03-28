using LendQ.Api.Extensions;
using LendQ.Application.DTOs.Loans;
using LendQ.Application.DTOs.Loans.ChangeRequests;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Route("api/v1/loans")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;

    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLoans()
    {
        var userId = User.GetUserId();
        var loans = await _loanService.GetLoansAsync(userId);
        return Ok(new { items = loans });
    }

    [HttpPost]
    public async Task<ActionResult<LoanDetailResponse>> CreateLoan(CreateLoanRequest request)
    {
        var userId = User.GetUserId();
        var loan = await _loanService.CreateLoanAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { loanId = loan.Id }, loan);
    }

    [HttpGet("{loanId:guid}")]
    public async Task<ActionResult<LoanDetailResponse>> GetById(Guid loanId)
    {
        var loan = await _loanService.GetByIdAsync(loanId);
        return Ok(loan);
    }

    [HttpPatch("{loanId:guid}")]
    public async Task<ActionResult<LoanDetailResponse>> UpdateLoan(Guid loanId, UpdateLoanRequest request)
    {
        var userId = User.GetUserId();
        var loan = await _loanService.UpdateLoanAsync(loanId, request, userId);
        return Ok(loan);
    }

    [HttpGet("{loanId:guid}/terms-versions")]
    public async Task<IActionResult> GetTermsVersions(Guid loanId)
    {
        var versions = await _loanService.GetTermsVersionsAsync(loanId);
        return Ok(new { items = versions });
    }

    [HttpGet("{loanId:guid}/change-requests")]
    public async Task<IActionResult> GetChangeRequests(Guid loanId)
    {
        var requests = await _loanService.GetChangeRequestsAsync(loanId);
        return Ok(new { items = requests });
    }

    [HttpPost("{loanId:guid}/change-requests")]
    public async Task<IActionResult> CreateChangeRequest(Guid loanId, CreateChangeRequestRequest request)
    {
        var userId = User.GetUserId();
        var result = await _loanService.CreateChangeRequestAsync(loanId, request, userId);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("{loanId:guid}/change-requests/{requestId:guid}/approve")]
    public async Task<IActionResult> ApproveChangeRequest(Guid loanId, Guid requestId)
    {
        var userId = User.GetUserId();
        var result = await _loanService.ApproveChangeRequestAsync(loanId, requestId, userId);
        return Ok(result);
    }

    [HttpPost("{loanId:guid}/change-requests/{requestId:guid}/reject")]
    public async Task<IActionResult> RejectChangeRequest(Guid loanId, Guid requestId)
    {
        var userId = User.GetUserId();
        var result = await _loanService.RejectChangeRequestAsync(loanId, requestId, userId);
        return Ok(result);
    }
}
