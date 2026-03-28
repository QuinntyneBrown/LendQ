namespace LendQ.Application.DTOs.Loans.ChangeRequests;

public class CreateChangeRequestRequest
{
    public string Type { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public Dictionary<string, object>? ProposedTerms { get; set; }
}
