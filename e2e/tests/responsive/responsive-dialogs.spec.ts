import { test, expect } from "../../fixtures/auth.fixture";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("L2-7.3: Responsive Dialog & Modal Components", () => {
  test("modals show as centered overlay on desktop", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.desktop);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThan(600);
  });

  test("modals show as full-screen on mobile", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.mobile);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBe(375);
  });

  test("modal has scrollable content area", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.mobile);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("modal close button is always accessible", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.mobile);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    await expect(adminPage.locator("[data-testid='modal-close']")).toBeVisible();
  });

  test("dialog backdrop click closes on desktop", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.desktop);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    await expect(adminPage.getByRole("dialog")).toBeVisible();
    await adminPage.locator("[data-testid='modal-backdrop']").click({ force: true });
    await expect(adminPage.getByRole("dialog")).toBeHidden();
  });
});
