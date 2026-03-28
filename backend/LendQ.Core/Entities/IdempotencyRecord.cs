namespace LendQ.Core.Entities;

public class IdempotencyRecord : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string? ResponseJson { get; set; }
    public int StatusCode { get; set; }
    public DateTime ExpiresAt { get; set; }
}
