using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface INotificationService
{
    Task<List<Notification>> GetNotificationsAsync();
    Task<int> GetUnreadCountAsync();
    Task MarkReadAsync(string notificationId);
    Task MarkAllReadAsync();
    int UnreadCount { get; }
    event Action? OnChange;
}
