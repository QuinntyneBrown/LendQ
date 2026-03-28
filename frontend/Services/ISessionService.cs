using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface ISessionService
{
    Task<List<SessionSummary>> GetSessionsAsync();
    Task RevokeSessionAsync(string sessionId);
    Task LogoutAllAsync();
}
