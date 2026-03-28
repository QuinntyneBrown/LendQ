using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class UserService : IUserService
{
    private readonly HttpClient _http;

    public UserService(HttpClient http)
    {
        _http = http;
    }

    public async Task<PaginatedResponse<UserSummary>> GetUsersAsync(int page = 1, string? search = null)
    {
        var url = $"users?page={page}";
        if (!string.IsNullOrWhiteSpace(search))
            url += $"&search={Uri.EscapeDataString(search)}";

        return await _http.GetFromJsonAsync<PaginatedResponse<UserSummary>>(url)
            ?? new PaginatedResponse<UserSummary>();
    }

    public async Task<UserSummary> GetUserAsync(string id)
    {
        return await _http.GetFromJsonAsync<UserSummary>($"users/{id}")
            ?? throw new InvalidOperationException("User not found.");
    }

    public async Task<UserSummary> CreateUserAsync(UserFormModel model)
    {
        var response = await _http.PostAsJsonAsync("users", model);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<UserSummary>()
            ?? throw new InvalidOperationException("Create user response was null.");
    }

    public async Task<UserSummary> UpdateUserAsync(string id, UserFormModel model)
    {
        var response = await _http.PutAsJsonAsync($"users/{id}", model);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<UserSummary>()
            ?? throw new InvalidOperationException("Update user response was null.");
    }

    public async Task<List<BorrowerDirectoryItem>> SearchBorrowersAsync(string search)
    {
        return await _http.GetFromJsonAsync<List<BorrowerDirectoryItem>>(
            $"users/borrowers?search={Uri.EscapeDataString(search)}")
            ?? new List<BorrowerDirectoryItem>();
    }
}
