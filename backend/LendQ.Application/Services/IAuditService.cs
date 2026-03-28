namespace LendQ.Application.Services;

public interface IAuditService
{
    Task LogEventAsync(string eventType, Guid? userId, string description, string? metadataJson = null, string? ipAddress = null, string? requestId = null);
    Task<IReadOnlyList<object>> SearchEventsAsync(string? eventType, Guid? userId, DateTime? from, DateTime? to);
}
