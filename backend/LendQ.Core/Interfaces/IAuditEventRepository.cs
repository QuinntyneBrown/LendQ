using LendQ.Core.Entities;

namespace LendQ.Core.Interfaces;

public interface IAuditEventRepository : IRepository<AuditEvent>
{
    Task<IReadOnlyList<AuditEvent>> SearchAsync(string? eventType, Guid? userId, DateTime? from, DateTime? to);
}
