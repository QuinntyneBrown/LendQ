using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class SettingsService : ISettingsService
{
    private readonly HttpClient _http;

    public SettingsService(HttpClient http)
    {
        _http = http;
    }

    public async Task<NotificationPreferences> GetPreferencesAsync()
    {
        return await _http.GetFromJsonAsync<NotificationPreferences>("settings/notifications")
            ?? new NotificationPreferences();
    }

    public async Task UpdatePreferencesAsync(NotificationPreferences prefs)
    {
        var response = await _http.PutAsJsonAsync("settings/notifications", prefs);
        response.EnsureSuccessStatusCode();
    }
}
