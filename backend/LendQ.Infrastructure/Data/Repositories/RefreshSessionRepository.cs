using LendQ.Core.Entities;
using LendQ.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LendQ.Infrastructure.Data.Repositories;

public class RefreshSessionRepository : Repository<RefreshSession>, IRefreshSessionRepository
{
    public RefreshSessionRepository(AppDbContext context) : base(context) { }

    public async Task<RefreshSession?> GetByTokenHashAsync(string tokenHash)
    {
        return await DbSet
            .Include(s => s.User).ThenInclude(u => u.RoleAssignments)
            .FirstOrDefaultAsync(s => s.TokenHash == tokenHash);
    }

    public async Task<IReadOnlyList<RefreshSession>> GetActiveByUserIdAsync(Guid userId)
    {
        return await DbSet
            .Where(s => s.UserId == userId && !s.IsRevoked && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.LastSeenAt)
            .ToListAsync();
    }

    public async Task RevokeAllByUserIdAsync(Guid userId, Guid? exceptSessionId = null)
    {
        var query = DbSet.Where(s => s.UserId == userId && !s.IsRevoked);

        if (exceptSessionId.HasValue)
        {
            query = query.Where(s => s.Id != exceptSessionId.Value);
        }

        await query.ExecuteUpdateAsync(s => s.SetProperty(r => r.IsRevoked, true));
    }
}
