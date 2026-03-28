namespace LendQ.Application.DTOs.Roles;

public class UpdateRolePermissionsRequest
{
    public List<string> Permissions { get; set; } = new();
}
