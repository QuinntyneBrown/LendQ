import { test, expect } from "../../fixtures/auth.fixture";
import { VIEWPORTS } from "../../fixtures/viewport.fixture";

test.describe("Responsive table/card layouts", () => {
  test("desktop: user list as data table", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.desktop);
    await adminPage.goto("/users");
    await expect(adminPage.getByRole("table")).toBeVisible();
  });

  test("mobile: user list as card list", async ({ adminPage }) => {
    await adminPage.setViewportSize(VIEWPORTS.mobile);
    await adminPage.goto("/users");
    await expect(adminPage.locator("[data-testid='user-card']").first()).toBeVisible();
  });

  test("desktop: loan list as data table", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.desktop);
    await creditorPage.goto("/loans");
    await expect(creditorPage.getByRole("table")).toBeVisible();
  });

  test("mobile: loan list as card list", async ({ creditorPage }) => {
    await creditorPage.setViewportSize(VIEWPORTS.mobile);
    await creditorPage.goto("/loans");
    await expect(creditorPage.locator("[data-testid='loan-card']").first()).toBeVisible();
  });
});
