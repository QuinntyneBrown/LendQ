using LendQ.Core.Entities;
using LendQ.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LendQ.Infrastructure.Data.Repositories;

public class LoanRepository : Repository<Loan>, ILoanRepository
{
    public LoanRepository(AppDbContext context) : base(context) { }

    public async Task<Loan?> GetByIdWithDetailsAsync(Guid id)
    {
        return await DbSet
            .Include(l => l.Borrower).ThenInclude(u => u.RoleAssignments)
            .Include(l => l.Creditor).ThenInclude(u => u.RoleAssignments)
            .Include(l => l.TermsVersions)
            .Include(l => l.ScheduleVersions).ThenInclude(sv => sv.Installments)
            .Include(l => l.PaymentTransactions).ThenInclude(pt => pt.Allocations)
            .Include(l => l.ChangeRequests)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<IReadOnlyList<Loan>> GetByUserIdAsync(Guid userId)
    {
        return await DbSet
            .Include(l => l.Borrower)
            .Include(l => l.Creditor)
            .Where(l => l.BorrowerId == userId || l.CreditorId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }
}
