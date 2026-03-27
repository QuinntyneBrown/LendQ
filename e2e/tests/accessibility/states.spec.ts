import { test, expect } from "../../fixtures/auth.fixture";

test.describe("L2-7.5: Loading, Empty, Error, and Success States", () => {
  test("dashboard shows loading skeletons", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/**", (route) =>
      new Promise((resolve) => setTimeout(() => resolve(route.continue()), 3000)),
    );
    await creditorPage.goto("/dashboard");
    await expect(creditorPage.locator("[data-testid='skeleton']").first()).toBeVisible();
  });

  test("loan list shows empty state", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/loans*", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [], total: 0, page: 1, per_page: 20, pages: 0 }),
      }),
    );
    await creditorPage.goto("/loans");
    await expect(creditorPage.getByTestId("empty-state")).toBeVisible();
  });

  test("user list shows empty state for search with no results", async ({ adminPage }) => {
    await adminPage.goto("/users");
    await adminPage.getByPlaceholder(/Search users/i).fill("zzz_nonexistent_zzz");
    await adminPage.waitForTimeout(400);
    await expect(adminPage.getByTestId("empty-state")).toBeVisible();
  });

  test("notification list shows empty state", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/notifications*", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ items: [], total: 0, page: 1, per_page: 20, pages: 0 }),
      }),
    );
    await creditorPage.goto("/notifications");
    await expect(creditorPage.getByTestId("empty-state")).toBeVisible();
  });

  test("error states show retry action", async ({ creditorPage }) => {
    await creditorPage.route("**/api/v1/dashboard/summary", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "Server error" }) }),
    );
    await creditorPage.goto("/dashboard");
    await expect(creditorPage.getByRole("button", { name: "Retry" }).first()).toBeVisible();
  });

  test("forms show field-level error states", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByTestId("error-email")).toBeVisible();
  });

  test("successful actions show feedback", async ({ adminPage }) => {
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: /Add User/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByLabel("Full Name").fill("State Test User");
    await dialog.getByLabel("Email Address").fill(`state_${Date.now()}@family.com`);
    await dialog.getByLabel("Borrower").check();
    await dialog.getByRole("button", { name: /Save/i }).click();
    await expect(adminPage.locator("[data-testid='toast-success']").first()).toBeVisible();
  });
});
