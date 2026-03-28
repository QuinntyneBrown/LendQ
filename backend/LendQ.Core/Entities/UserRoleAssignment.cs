using LendQ.Core.Enums;

namespace LendQ.Core.Entities;

public class UserRoleAssignment : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public UserRole Role { get; set; }
}
