namespace LendQ.Core.Entities;

public class AuditEvent : BaseEntity
{
    public string EventType { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? MetadataJson { get; set; }
    public string? IpAddress { get; set; }
    public string? RequestId { get; set; }
}
