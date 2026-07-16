import { test, expect } from "@playwright/test";
import {
  addFixtureAvailability,
  createFixtureMentor,
  createFixtureService,
  deleteFixtureMentor,
  fixturesAvailable,
  type FixtureMentor,
  type FixtureService,
} from "./helpers/mentorship-fixture";

/**
 * Mentorship — full booking + admin flows (authenticated `admin` project),
 * against a throwaway published mentor with two FREE services:
 *  - digital  → zero-payment booking, no slot picker
 *  - call     → SlotPicker path (availability fixture keeps slots open)
 * Covers: booking + confirmation email payload, My Bookings, the admin
 * bookings Manage dialog (status → completed), the post-session review, and
 * the admin review console. Everything is deleted afterwards.
 */

test.describe.configure({ mode: "serial" });

const BOOKER_EMAIL = `e2e-booker-${Date.now()}@example.com`;

let mentor: FixtureMentor | undefined;
let digital: FixtureService | undefined;
let call: FixtureService | undefined;

test.beforeAll(async () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  mentor = await createFixtureMentor();
  [digital, call] = await Promise.all([
    createFixtureService(mentor.id, "digital"),
    createFixtureService(mentor.id, "call"),
  ]);
  await addFixtureAvailability(mentor.id);
});

test.afterAll(async () => {
  await deleteFixtureMentor(mentor?.id);
});

test("a signed-in Yatri books a free service and the confirmation email is composed", async ({ page }) => {
  let emailPayload: { to?: string; subject?: string; html?: string } | undefined;
  await page.route("**/api/send-email", async (route) => {
    emailPayload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });

  await page.goto(`/mentorship/${mentor!.slug}/${digital!.slug}`);
  await expect(page.getByRole("heading", { name: digital!.title })).toBeVisible();

  await page.getByLabel(/Full name/i).fill("E2E Booking Yatri");
  await page.getByLabel(/^Email$/i).fill(BOOKER_EMAIL);
  await page.getByRole("button", { name: /Book Now/i }).click();

  await expect(
    page.getByRole("heading", { name: /You are all set, Yatri/i })
  ).toBeVisible({ timeout: 20_000 });

  expect(emailPayload?.to).toBe(BOOKER_EMAIL);
  expect(emailPayload?.subject).toBe(`Booking confirmed: ${digital!.title} with ${mentor!.name}`);
  expect(emailPayload?.html).toContain("Your booking is confirmed");
});

test("the booking shows up in My Bookings", async ({ page }) => {
  await page.goto("/mentorship/bookings");
  await expect(page.getByRole("heading", { name: /My mentorship bookings/i })).toBeVisible();
  await expect(page.getByText(digital!.title).first()).toBeVisible();
  await expect(page.getByText(/Confirmed/i).first()).toBeVisible();
});

test("a call service offers time slots and books through the SlotPicker", async ({ page }) => {
  await page.route("**/api/send-email", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );

  await page.goto(`/mentorship/${mentor!.slug}/${call!.slug}`);
  await expect(page.getByRole("heading", { name: call!.title })).toBeVisible();
  await expect(page.getByText(/Pick a time/i)).toBeVisible();

  // Date strip (role=tab), then the first open time in the grid.
  await page.getByRole("tab").first().click();
  const slot = page.locator("button[aria-pressed]").filter({ hasText: /\d{1,2}:\d{2}/ }).first();
  await slot.waitFor({ state: "visible", timeout: 10_000 });
  await slot.click();
  await expect(page.getByText(/Selected:/i)).toBeVisible();

  await page.getByLabel(/Full name/i).fill("E2E Slot Yatri");
  await page.getByLabel(/^Email$/i).fill(`e2e-slot-${Date.now()}@example.com`);
  await page.getByRole("button", { name: /Book Now/i }).click();

  await expect(
    page.getByRole("heading", { name: /You are all set, Yatri/i })
  ).toBeVisible({ timeout: 20_000 });
});

test("admin bookings console manages the booking to completed", async ({ page }) => {
  await page.goto("/admin/mentorship/bookings");
  await page.getByTestId("bookings-search").fill(BOOKER_EMAIL);
  const manage = page.getByRole("button", { name: /Manage the booking/i }).first();
  await expect(manage).toBeVisible();
  await manage.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Manage booking/i)).toBeVisible();
  // Status is a Radix Select inside the dialog.
  await dialog.getByRole("combobox").first().click();
  await page.getByRole("option", { name: /completed/i }).click();
  await dialog.getByRole("button", { name: /^Save/i }).click();
  await expect(page.getByText(/^Saved$/i).first()).toBeVisible({ timeout: 15_000 });
});

test("a completed session can be reviewed and the review reaches the admin console", async ({ page }) => {
  await page.goto("/mentorship/bookings");
  const reviewHeading = page.getByRole("heading", { name: /How was your session\?/i }).first();
  await expect(reviewHeading).toBeVisible({ timeout: 15_000 });

  // Rating defaults to 5 stars — only the comment is required.
  const comment = page.locator("textarea").first();
  await comment.fill("E2E review: great throwaway session, safe to delete.");
  await page.getByRole("button", { name: /Submit review/i }).first().click();
  await expect(page.getByText(/Thank you, Yatri/i).first()).toBeVisible({ timeout: 15_000 });

  await page.goto("/admin/mentorship/reviews");
  await page.getByTestId("mentor-reviews-search").fill("E2E review: great throwaway session");
  await expect(page.getByText(/great throwaway session/i).first()).toBeVisible({ timeout: 10_000 });
});

test("admin services console lists the fixture services", async ({ page }) => {
  await page.goto("/admin/mentorship/services");
  await page.getByTestId("services-search").fill(mentor!.name);
  await expect(page.getByText(digital!.title).first()).toBeVisible();
  await expect(page.getByText(call!.title).first()).toBeVisible();
});
