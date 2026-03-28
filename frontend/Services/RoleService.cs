using System.Net.Http.Json;
using LendQ.Client.Models;

namespace LendQ.Client.Services;

public class RoleService : IRoleService
{
    private readonly HttpClient _http;

    public RoleService(HttpClient http)
    {
        _http = http;
    }

    public async Task<List<Role>> GetRolesAsync()
    {
        return await _http.GetFromJsonAsync<List<Role>>("roles")
            ?? new List<Role>();
    }

    public async Task UpdatePermissionsAsync(string roleKey, List<string> permissions)
    {
        var response = await _http.PutAsJsonAsync($"roles/{roleKey}/permissions", new { permissions });
        response.EnsureSuccessStatusCode();
    }
}
