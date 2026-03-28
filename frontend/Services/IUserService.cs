using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IUserService
{
    Task<PaginatedResponse<UserSummary>> GetUsersAsync(int page = 1, string? search = null);
    Task<UserSummary> GetUserAsync(string id);
    Task<UserSummary> CreateUserAsync(UserFormModel model);
    Task<UserSummary> UpdateUserAsync(string id, UserFormModel model);
    Task<List<BorrowerDirectoryItem>> SearchBorrowersAsync(string search);
}
