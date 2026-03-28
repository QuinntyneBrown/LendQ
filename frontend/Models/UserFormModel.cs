using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class UserFormModel
{
    [Required]
    public string Name { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    public List<string> Roles { get; set; } = new();

    public bool IsActive { get; set; }
}
