using LendQ.Api.Extensions;
using LendQ.Application.DTOs.Payments;
using LendQ.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LendQ.Api.Controllers;

[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet("api/v1/loans/{loanId:guid}/schedule")]
    public async Task<IActionResult> GetSchedule(Guid loanId)
    {
        var schedule = await _paymentService.GetScheduleAsync(loanId);
        return Ok(schedule);
    }

    [HttpGet("api/v1/loans/{loanId:guid}/payments")]
    public async Task<IActionResult> GetPayments(Guid loanId)
    {
        var payments = await _paymentService.GetByLoanIdAsync(loanId);
        return Ok(new { items = payments });
    }

    [HttpPost("api/v1/loans/{loanId:guid}/payments")]
    public async Task<ActionResult<PaymentTransactionResponse>> RecordPayment(
        Guid loanId,
        RecordPaymentRequest request,
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey)
    {
        var userId = User.GetUserId();
        var payment = await _paymentService.RecordPaymentAsync(loanId, request, idempotencyKey, userId);
        return StatusCode(StatusCodes.Status201Created, payment);
    }

    [HttpPost("api/v1/payments/{paymentId:guid}/reversals")]
    public async Task<ActionResult<PaymentTransactionResponse>> ReversePayment(
        Guid paymentId,
        ReversalRequest request,
        [FromHeader(Name = "Idempotency-Key")] string idempotencyKey)
    {
        var userId = User.GetUserId();
        var reversal = await _paymentService.ReversePaymentAsync(paymentId, request, idempotencyKey, userId);
        return StatusCode(StatusCodes.Status201Created, reversal);
    }

    [HttpPost("api/v1/loans/{loanId:guid}/schedule-adjustments/reschedule")]
    public async Task<IActionResult> Reschedule(Guid loanId, ScheduleAdjustmentRequest request)
    {
        var userId = User.GetUserId();
        await _paymentService.RescheduleAsync(loanId, request, userId);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPost("api/v1/loans/{loanId:guid}/schedule-adjustments/pause")]
    public async Task<IActionResult> Pause(Guid loanId, ScheduleAdjustmentRequest request)
    {
        var userId = User.GetUserId();
        await _paymentService.PauseAsync(loanId, request, userId);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpGet("api/v1/loans/{loanId:guid}/history")]
    public async Task<IActionResult> GetHistory(Guid loanId)
    {
        var history = await _paymentService.GetHistoryAsync(loanId);
        return Ok(new { items = history });
    }
}
