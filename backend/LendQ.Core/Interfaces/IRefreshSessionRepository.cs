using LendQ.Core.Entities;

namespace LendQ.Core.Interfaces;

public interface IRefreshSessionRepository : IRepository<RefreshSession>
{
    Task<RefreshSession?> GetByTokenHashAsync(string tokenHash);
    Task<IReadOnlyList<RefreshSession>> GetActiveByUserIdAsync(Guid userId);
    Task RevokeAllByUserIdAsync(Guid userId, Guid? exceptSessionId = null);
}
