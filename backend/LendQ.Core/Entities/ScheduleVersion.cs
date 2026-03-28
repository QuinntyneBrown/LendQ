namespace LendQ.Core.Entities;

public class ScheduleVersion : BaseEntity
{
    public Guid LoanId { get; set; }
    public Loan Loan { get; set; } = null!;

    public int Version { get; set; }
    public DateTime EffectiveAt { get; set; } = DateTime.UtcNow;

    public ICollection<ScheduleInstallment> Installments { get; set; } = new List<ScheduleInstallment>();
}
