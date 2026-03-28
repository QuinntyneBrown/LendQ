using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class CustomScheduleRowModel
{
    [Required]
    public string DueDate { get; set; } = "";

    [Required]
    public decimal AmountDue { get; set; }
}
