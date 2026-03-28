using LendQ.Client.Models;

namespace LendQ.Client.Services;

public interface IRoleService
{
    Task<List<Role>> GetRolesAsync();
    Task UpdatePermissionsAsync(string roleKey, List<string> permissions);
}
