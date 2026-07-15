import { test, expect } from "@playwright/test";

/**
 * Events admin — authenticated, NON-MUTATING smoke + control checks (runs under
 * the `admin` project, reusing auth.setup.ts's session).
 *
 * Verifies the admin events surface + the CreateEvent builder render, and that
 * the search / tab / navigation controls respond to real input. It deliberately
 * does NOT create or delete real events: events are production data with side
 * effects (registrations, emails), so create→delete belongs in a fixture-backed
 * suite, not here.
 */

test("events admin: list surface renders with search, tabs, and create", async ({
  page,
}) => {
  await page.goto("/admin/events");
  await expect(page.getByRole("heading", { name: /My Events/i })).toBeVisible();
  await expect(page.getByTestId("events-search")).toBeVisible();
  await expect(page.getByTestId("events-create")).toBeVisible();

  // Switching to the Past tab doesn't break the surface.
  await page.getByTestId("events-tab-past").click();
  await expect(page.getByTestId("events-search")).toBeVisible();
});

test("events admin: search box accepts input", async ({ page }) => {
  await page.goto("/admin/events");
  const search = page.getByTestId("events-search");
  await search.fill("zzz-no-such-event-xyz");
  await expect(search).toHaveValue("zzz-no-such-event-xyz");
});

test("events admin: Create Event opens the event builder", async ({ page }) => {
  await page.goto("/admin/events");
  await page.getByTestId("events-create").click();
  await expect(page).toHaveURL(/\/createevent/);
  // The builder opens on an intro step; advance to the details form.
  await page.getByRole("button", { name: /Continue to Event Details/i }).click();
  await expect(page.getByTestId("event-name")).toBeVisible();
});
