using LendQ.Core.Entities;

namespace LendQ.Core.Interfaces;

public interface IPaymentRepository : IRepository<PaymentTransaction>
{
    Task<IReadOnlyList<PaymentTransaction>> GetByLoanIdAsync(Guid loanId);
    Task<PaymentTransaction?> GetByIdempotencyKeyAsync(string key);
}
