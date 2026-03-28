using LendQ.Core.Entities;
using LendQ.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LendQ.Infrastructure.Data.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public new async Task<User?> GetByIdAsync(Guid id)
    {
        return await DbSet
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await DbSet
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IReadOnlyList<User>> GetBorrowersAsync(string? search)
    {
        var query = DbSet
            .Include(u => u.RoleAssignments)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term));
        }

        return await query.ToListAsync();
    }

    public async Task<User?> GetByEmailVerificationTokenAsync(string token)
    {
        return await DbSet
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }

    public async Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return await DbSet
            .Include(u => u.RoleAssignments)
            .FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }
}
