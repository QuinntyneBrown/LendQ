using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class SessionService : ISessionService
{
    private readonly HttpClient _http;

    public SessionService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<SessionSummary>> GetSessionsAsync()
    {
        return await _http.GetFromJsonAsync<List<SessionSummary>>("sessions")
            ?? new List<SessionSummary>();
    }

    public async Task RevokeSessionAsync(string sessionId)
    {
        var response = await _http.DeleteAsync($"sessions/{sessionId}");
        response.EnsureSuccessStatusCode();
    }

    public async Task LogoutAllAsync()
    {
        var response = await _http.PostAsync("sessions/logout-all", null);
        response.EnsureSuccessStatusCode();
    }
}
