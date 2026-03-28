using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class NotificationService : INotificationService
{
    private readonly HttpClient _http;

    public NotificationService(HttpClient http)
    {
        _http = http;
    }

    public int UnreadCount { get; private set; }
    public event Action? OnChange;

    public async Task<List<Notification>> GetNotificationsAsync()
    {
        return await _http.GetFromJsonAsync<List<Notification>>("notifications")
            ?? new List<Notification>();
    }

    public async Task<int> GetUnreadCountAsync()
    {
        var result = await _http.GetFromJsonAsync<Dictionary<string, int>>("notifications/unread-count");
        var count = result?["count"] ?? 0;
        if (UnreadCount != count)
        {
            UnreadCount = count;
            OnChange?.Invoke();
        }
        return UnreadCount;
    }

    public async Task MarkReadAsync(string notificationId)
    {
        var response = await _http.PostAsync($"notifications/{notificationId}/read", null);
        response.EnsureSuccessStatusCode();
        if (UnreadCount > 0)
        {
            UnreadCount--;
            OnChange?.Invoke();
        }
    }

    public async Task MarkAllReadAsync()
    {
        var response = await _http.PostAsync("notifications/read-all", null);
        response.EnsureSuccessStatusCode();
        UnreadCount = 0;
        OnChange?.Invoke();
    }
}
