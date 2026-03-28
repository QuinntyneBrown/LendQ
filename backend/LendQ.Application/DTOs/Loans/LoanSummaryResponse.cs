namespace LendQ.Application.DTOs.Loans;

public class LoanSummaryResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string CounterpartyName { get; init; } = string.Empty;
    public string PrincipalAmount { get; init; } = string.Empty;
    public string OutstandingBalance { get; init; } = string.Empty;
    public DateOnly? NextDueDate { get; init; }
    public string Status { get; init; } = string.Empty;
}
