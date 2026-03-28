namespace LendQ.Application.DTOs.Roles;

public class RoleResponse
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public List<string> Permissions { get; init; } = new();
}
