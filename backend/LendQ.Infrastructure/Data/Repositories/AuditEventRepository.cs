using LendQ.Core.Entities;
using LendQ.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LendQ.Infrastructure.Data.Repositories;

public class AuditEventRepository : Repository<AuditEvent>, IAuditEventRepository
{
    public AuditEventRepository(AppDbContext context) : base(context) { }

    public async Task<IReadOnlyList<AuditEvent>> SearchAsync(string? eventType, Guid? userId, DateTime? from, DateTime? to)
    {
        var query = DbSet.AsQueryable();

        if (!string.IsNullOrWhiteSpace(eventType))
        {
            query = query.Where(a => a.EventType == eventType);
        }

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= to.Value);
        }

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }
}
