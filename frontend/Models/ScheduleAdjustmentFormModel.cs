using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class ScheduleAdjustmentFormModel
{
    [Required]
    public List<string> InstallmentIds { get; set; } = new();

    public string? NewDueDate { get; set; }

    [Required]
    public string Reason { get; set; } = "";

    public string? RequestedMode { get; set; }
}
