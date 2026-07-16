import { test, expect } from "@playwright/test";

/**
 * Training — public (unauthenticated) smokes. The full publish → enroll →
 * dashboard journey lives in training-flow-admin.spec.ts (needs a session).
 */

test.describe("Training — public", () => {
  test("catalog renders with hero and search", async ({ page }) => {
    await page.goto("/training");
    await expect(page.getByRole("heading", { name: /Real cloud skills/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search a certification, skill/i)).toBeVisible();
  });

  test("an unknown course shows the not-found state", async ({ page }) => {
    await page.goto("/training/no-such-course-xyz");
    await expect(page.getByRole("heading", { name: /Course Not Found/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Back to Catalog/i })).toBeVisible();
  });

  test("my-trainings shows the empty state when signed out", async ({ page }) => {
    await page.goto("/my-trainings");
    await expect(page.getByRole("heading", { name: /My Learning Journey/i })).toBeVisible();
    await expect(page.getByText(/No Enrollments Yet/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Explore Training/i })).toBeVisible();
  });
});
