using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class LoginFormModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = "";
}
