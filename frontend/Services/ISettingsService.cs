using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface ISettingsService
{
    Task<NotificationPreferences> GetPreferencesAsync();
    Task UpdatePreferencesAsync(NotificationPreferences prefs);
}
