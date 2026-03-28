using LendQ.Application.DTOs.Users;

namespace LendQ.Application.Services;

public interface IUserService
{
    Task<IReadOnlyList<UserResponse>> GetUsersAsync();
    Task<UserResponse> GetByIdAsync(Guid userId);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse> UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task<IReadOnlyList<BorrowerDirectoryItemResponse>> SearchBorrowersAsync(string? search);
}
