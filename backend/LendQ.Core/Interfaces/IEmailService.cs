namespace LendQ.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string toEmail, string token);
    Task SendPasswordResetAsync(string toEmail, string token);
    Task SendNotificationEmailAsync(string toEmail, string subject, string body);
}
