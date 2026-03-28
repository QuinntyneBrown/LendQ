using LendQ.Application.DTOs.Notifications;

namespace LendQ.Application.Services;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> GetNotificationsAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<NotificationPreferencesResponse> GetPreferencesAsync(Guid userId);
    Task<NotificationPreferencesResponse> UpdatePreferencesAsync(Guid userId, UpdateNotificationPreferencesRequest request);
}
