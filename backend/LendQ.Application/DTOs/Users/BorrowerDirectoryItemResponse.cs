namespace LendQ.Application.DTOs.Users;

public class BorrowerDirectoryItemResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
