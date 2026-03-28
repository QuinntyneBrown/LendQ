using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IPaymentService
{
    Task<ScheduleVersion> GetScheduleAsync(string loanId);
    Task<List<PaymentTransaction>> GetPaymentsAsync(string loanId);
    Task<PaymentTransaction> RecordPaymentAsync(string loanId, RecordPaymentFormModel model);
    Task<PaymentTransaction> ReversePaymentAsync(string paymentId, string reason);
    Task RescheduleAsync(string loanId, ScheduleAdjustmentFormModel model);
    Task PauseAsync(string loanId, ScheduleAdjustmentFormModel model);
    Task<List<object>> GetHistoryAsync(string loanId);
    event Action? OnChange;
}
