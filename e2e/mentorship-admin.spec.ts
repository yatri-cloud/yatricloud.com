import { test, expect } from "@playwright/test";

/**
 * Mentorship admin — authenticated, NON-MUTATING smoke + control checks (runs
 * under the `admin` project, reusing auth.setup.ts's session).
 *
 * Verifies each mentorship management page renders with its search box + primary
 * action, and that the Radix "Add service" dialog opens. It does NOT create,
 * edit, approve, or delete real mentorship data (mentors/services/bookings have
 * real-world side effects) — those flows want a fixture-backed suite.
 */

test("mentorship admin: services page renders + add-service dialog opens", async ({
  page,
}) => {
  await page.goto("/admin/mentorship/services");
  await expect(page.getByRole("heading", { name: /^Services$/i }).first()).toBeVisible();
  await expect(page.getByTestId("services-search")).toBeVisible();

  // The Radix Add-service dialog opens and renders its first field (no save).
  await page.getByTestId("service-add").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByTestId("service-title")).toBeVisible();
});

test("mentorship admin: mentors page renders with search + add", async ({ page }) => {
  await page.goto("/admin/mentorship/mentors");
  await expect(page.getByRole("heading", { name: /^Mentors$/i }).first()).toBeVisible();
  await expect(page.getByTestId("mentors-search")).toBeVisible();
  await expect(page.getByTestId("mentor-add")).toBeVisible();
});

test("mentorship admin: applications + bookings pages render with search", async ({
  page,
}) => {
  await page.goto("/admin/mentorship/applications");
  await expect(page.getByTestId("applications-search")).toBeVisible();

  await page.goto("/admin/mentorship/bookings");
  await expect(page.getByTestId("bookings-search")).toBeVisible();
});

test("mentorship admin: services search accepts input", async ({ page }) => {
  await page.goto("/admin/mentorship/services");
  const search = page.getByTestId("services-search");
  await search.fill("zzz-no-such-service-xyz");
  await expect(search).toHaveValue("zzz-no-such-service-xyz");
});
