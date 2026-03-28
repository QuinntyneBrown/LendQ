using LendQ.Application.DTOs.Roles;

namespace LendQ.Application.Services;

public interface IRoleService
{
    Task<List<RoleResponse>> GetRolesAsync();
    Task<RoleResponse> UpdateRolePermissionsAsync(string roleKey, UpdateRolePermissionsRequest request);
}
