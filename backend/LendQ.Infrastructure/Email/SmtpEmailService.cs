using System.Net.Mail;
using LendQ.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace LendQ.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailVerificationAsync(string toEmail, string token)
    {
        var subject = "Verify your email address";
        var body = $"Please verify your email by using this token: {token}";
        await SendAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetAsync(string toEmail, string token)
    {
        var subject = "Reset your password";
        var body = $"Use this token to reset your password: {token}";
        await SendAsync(toEmail, subject, body);
    }

    public async Task SendNotificationEmailAsync(string toEmail, string subject, string body)
    {
        await SendAsync(toEmail, subject, body);
    }

    private async Task SendAsync(string toEmail, string subject, string body)
    {
        try
        {
            var host = _configuration["Email:Host"] ?? "localhost";
            var port = int.Parse(_configuration["Email:Port"] ?? "25");
            var fromAddress = _configuration["Email:FromAddress"] ?? "noreply@lendq.com";

            using var client = new SmtpClient(host, port);
            var message = new MailMessage(fromAddress, toEmail, subject, body);

            await client.SendMailAsync(message);
            _logger.LogInformation("Email sent to {ToEmail} with subject '{Subject}'", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail} with subject '{Subject}'", toEmail, subject);
        }
    }
}
