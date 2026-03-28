using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class ResetPasswordFormModel
{
    public string Token { get; set; } = "";

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = "";

    [Required]
    [Compare("Password")]
    public string ConfirmPassword { get; set; } = "";
}
