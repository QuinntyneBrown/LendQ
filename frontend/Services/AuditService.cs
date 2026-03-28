using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class AuditService : IAuditService
{
    private readonly HttpClient _http;

    public AuditService(HttpClient http)
    {
        _http = http;
    }

    public async Task<PaginatedResponse<object>> SearchAuditEventsAsync(
        string? actor = null,
        string? target = null,
        string? action = null,
        DateTime? from = null,
        DateTime? to = null,
        int page = 1)
    {
        var query = new List<string> { $"page={page}" };

        if (!string.IsNullOrWhiteSpace(actor))
            query.Add($"actor={Uri.EscapeDataString(actor)}");
        if (!string.IsNullOrWhiteSpace(target))
            query.Add($"target={Uri.EscapeDataString(target)}");
        if (!string.IsNullOrWhiteSpace(action))
            query.Add($"action={Uri.EscapeDataString(action)}");
        if (from.HasValue)
            query.Add($"from={from.Value:O}");
        if (to.HasValue)
            query.Add($"to={to.Value:O}");

        var url = $"audit?{string.Join("&", query)}";
        return await _http.GetFromJsonAsync<PaginatedResponse<object>>(url)
            ?? new PaginatedResponse<object>();
    }
}
