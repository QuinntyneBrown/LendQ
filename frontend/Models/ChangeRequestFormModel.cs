using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class ChangeRequestFormModel
{
    [Required]
    public string Type { get; set; } = "";

    [Required]
    public string Reason { get; set; } = "";

    public Dictionary<string, string>? ProposedTerms { get; set; }
}
