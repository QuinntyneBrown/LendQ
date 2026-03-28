using LendQ.Core.Entities;
using LendQ.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LendQ.Infrastructure.Data.Repositories;

public class PaymentRepository : Repository<PaymentTransaction>, IPaymentRepository
{
    public PaymentRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<PaymentTransaction>> GetByLoanIdAsync(Guid loanId)
    {
        return await DbSet
            .Include(p => p.Allocations)
            .Where(p => p.LoanId == loanId)
            .OrderByDescending(p => p.PostedAt)
            .ToListAsync();
    }

    public async Task<PaymentTransaction?> GetByIdempotencyKeyAsync(string key)
    {
        return await DbSet
            .Include(p => p.Allocations)
            .FirstOrDefaultAsync(p => p.IdempotencyKey == key);
    }
}
