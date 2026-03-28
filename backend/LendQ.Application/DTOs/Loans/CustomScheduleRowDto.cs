namespace LendQ.Application.DTOs.Loans;

public class CustomScheduleRowDto
{
    public DateOnly DueDate { get; set; }
    public decimal AmountDue { get; set; }
}
