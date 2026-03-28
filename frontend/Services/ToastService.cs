namespace LendQ.Client.Services;

public class ToastService : IToastService
{
    public event Action<ToastMessage>? OnToastAdded;

    public void ShowSuccess(string message)
    {
        OnToastAdded?.Invoke(new ToastMessage(message, ToastType.Success, Guid.NewGuid().ToString()));
    }

    public void ShowError(string message)
    {
        OnToastAdded?.Invoke(new ToastMessage(message, ToastType.Error, Guid.NewGuid().ToString()));
    }

    public void ShowWarning(string message)
    {
        OnToastAdded?.Invoke(new ToastMessage(message, ToastType.Warning, Guid.NewGuid().ToString()));
    }

    public void ShowInfo(string message)
    {
        OnToastAdded?.Invoke(new ToastMessage(message, ToastType.Info, Guid.NewGuid().ToString()));
    }
}
