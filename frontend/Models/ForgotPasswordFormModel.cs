using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class ForgotPasswordFormModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";
}
