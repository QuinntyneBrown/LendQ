import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RolePermissionEditor } from "./RolePermissionEditor";
import type { Role } from "@/api/types";

vi.mock("./hooks", () => ({
  useUpdatePermissions: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/notifications/useToast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
}));

function makeRole(permissions: string[] = []): Role {
  return {
    id: "role-1",
    name: "Creditor",
    description: "Loan creator/manager",
    permissions,
  } as unknown as Role;
}

describe("RolePermissionEditor — bug 2026-04-17-role-editor-missing-permissions", () => {
  it("exposes `loans:create` in the permission catalog so admins can grant it", () => {
    render(
      <RolePermissionEditor
        open
        onClose={() => {}}
        role={makeRole(["loans:read"])}
      />,
    );

    expect(screen.getByLabelText("loans:create")).toBeInTheDocument();
  });

  it("exposes `roles:write` so admins can manage role-editing authority", () => {
    render(
      <RolePermissionEditor
        open
        onClose={() => {}}
        role={makeRole(["users:read"])}
      />,
    );

    expect(screen.getByLabelText("roles:write")).toBeInTheDocument();
  });

  it("exposes `payments:reschedule` so admins can grant reschedule rights", () => {
    render(
      <RolePermissionEditor
        open
        onClose={() => {}}
        role={makeRole(["loans:read"])}
      />,
    );

    expect(screen.getByLabelText("payments:reschedule")).toBeInTheDocument();
  });
});
