using LendQ.Application.DTOs.Loans;
using LendQ.Application.DTOs.Payments;

namespace LendQ.Application.Services;

public interface IPaymentService
{
    Task<PaymentTransactionResponse> RecordPaymentAsync(Guid loanId, RecordPaymentRequest request, string idempotencyKey, Guid userId);
    Task<IReadOnlyList<PaymentTransactionResponse>> GetByLoanIdAsync(Guid loanId);
    Task<PaymentTransactionResponse> ReversePaymentAsync(Guid paymentId, ReversalRequest request, string idempotencyKey, Guid userId);
    Task<ScheduleVersionResponse> GetScheduleAsync(Guid loanId);
    Task RescheduleAsync(Guid loanId, ScheduleAdjustmentRequest request, Guid userId);
    Task PauseAsync(Guid loanId, ScheduleAdjustmentRequest request, Guid userId);
    Task<IReadOnlyList<object>> GetHistoryAsync(Guid loanId);
}
