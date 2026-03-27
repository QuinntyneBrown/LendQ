import { test, expect } from "../../fixtures/auth.fixture";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("L2-7.2: Responsive Button & Form Components", () => {
  test("buttons have 44px minimum touch target on mobile", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/login");
    const button = creditorPage.getByRole("button", { name: "Sign In" });
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test("login form adapts to mobile (single column, no left panel)", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/login");
    await expect(creditorPage.getByTestId("login-left-panel")).toBeHidden();
    await expect(creditorPage.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("create-loan modal is full-screen on mobile", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/loans");
    await creditorPage.getByRole("button", { name: /Create New Loan/i }).click();
    const dialog = creditorPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box!.width).toBe(375);
  });

  test("two-column form rows stack to single column on mobile", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/loans");
    await creditorPage.getByRole("button", { name: /Create New Loan/i }).click();
    const dialog = creditorPage.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("input fields are full-width on mobile", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/login");
    const input = creditorPage.getByLabel("Email Address");
    const inputBox = await input.boundingBox();
    expect(inputBox!.width).toBeGreaterThan(300);
  });
});
