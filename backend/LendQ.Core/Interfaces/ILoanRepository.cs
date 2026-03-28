using LendQ.Core.Entities;

namespace LendQ.Core.Interfaces;

public interface ILoanRepository : IRepository<Loan>
{
    Task<Loan?> GetByIdWithDetailsAsync(Guid id);
    Task<IReadOnlyList<Loan>> GetByUserIdAsync(Guid userId);
}
