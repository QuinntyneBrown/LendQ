using System.ComponentModel.DataAnnotations;

namespace LendQ.Client.Models;

public class RecordPaymentFormModel
{
    [Required]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PostedAt { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "";

    public string? Notes { get; set; }
}
