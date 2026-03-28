using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IAuditService
{
    Task<PaginatedResponse<object>> SearchAuditEventsAsync(
        string? actor = null,
        string? target = null,
        string? action = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1);
}
