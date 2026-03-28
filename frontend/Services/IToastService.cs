namespace LendQ.Client.Services;

public enum ToastType
{
    Success,
    Error,
    Warning,
    Info
}

public record ToastMessage(string Message, ToastType Type, string Id = "");

public interface IToastService
{
    event Action<ToastMessage>? OnToastAdded;
    void ShowSuccess(string message);
    void ShowError(string message);
    void ShowWarning(string message);
    void ShowInfo(string message);
}
