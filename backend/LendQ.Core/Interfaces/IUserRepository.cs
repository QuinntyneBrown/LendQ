using LendQ.Core.Entities;

namespace LendQ.Core.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<IReadOnlyList<User>> GetBorrowersAsync(string? search);
    Task<User?> GetByEmailVerificationTokenAsync(string token);
    Task<User?> GetByPasswordResetTokenAsync(string token);
}
