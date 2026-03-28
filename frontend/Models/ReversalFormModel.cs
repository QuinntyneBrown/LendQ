using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class ReversalFormModel
{
    [Required]
    [MinLength(3)]
    public string Reason { get; set; } = "";
}
