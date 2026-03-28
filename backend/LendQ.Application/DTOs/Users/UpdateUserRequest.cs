namespace LendQ.Application.DTOs.Users;

public class UpdateUserRequest
{
    public string? Name { get; set; }
    public string? Status { get; set; }
    public List<string>? Roles { get; set; }
}
