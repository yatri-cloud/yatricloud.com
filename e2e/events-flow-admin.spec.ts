import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  createFixtureEvent,
  deleteFixtureEvent,
  fixturesAvailable,
  seedRegistration,
  type FixtureEvent,
} from "./helpers/events-fixture";

/**
 * Events — full user + admin flows against private throwaway fixture events
 * (runs under the `admin` project with auth.setup.ts's signed-in session).
 *
 * This is the fixture-backed suite the smoke spec (events-admin.spec.ts)
 * points to: it registers for an event, checks My Events, the admin console
 * (search, row actions, registrations list, gallery), the sold-out waitlist
 * path, the attendees-only gallery gate, and finally deletes the event
 * through the UI. Fixtures are `visibility: "private"` so the public site
 * never lists them, and afterAll removes anything the UI delete missed.
 */

test.describe.configure({ mode: "serial" });

const REG_EMAIL = `e2e-reg-${Date.now()}@example.com`;

let upcoming: FixtureEvent | undefined;
let past: FixtureEvent | undefined;
let soldOut: FixtureEvent | undefined;
/** Registration code captured from the confirmation email during the register test. */
let regCode: string | undefined;

test.beforeAll(async () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  [upcoming, past, soldOut] = await Promise.all([
    createFixtureEvent({
      when: "upcoming",
      extraDetails: { isUpcoming: true, lookingForVenue: true },
    }),
    createFixtureEvent({ when: "past" }),
    createFixtureEvent({ when: "upcoming", capacity: 1 }),
  ]);
  await seedRegistration(soldOut.id, `e2e-seat-${Date.now()}@example.com`);
});

const UI_EVENT = `E2E UI Publish ${Date.now()}`;

test.afterAll(async () => {
  await Promise.all([
    deleteFixtureEvent(upcoming?.id),
    deleteFixtureEvent(past?.id),
    deleteFixtureEvent(soldOut?.id),
  ]);
  // The UI-published event has no captured id — clean it up by name.
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (url && key) await createClient(url, key).from("events").delete().eq("name", UI_EVENT);
});

test("an event publishes end to end through the builder UI", async ({ page }) => {
  // Regression: a free event once published as price_inr = null and every
  // UI publish failed on the NOT NULL constraint. Drive the real builder.
  await page.goto("/createevent");
  await page.getByRole("button", { name: /Continue to Event Details/i }).click();

  await page.getByTestId("event-name").fill(UI_EVENT);
  await page.locator("#description").fill("Throwaway UI-published event. Safe to delete.");
  await page.locator("#aboutEvent").fill("Created by the e2e suite to prove the publish path works.");
  await page.getByTestId("event-category").click();
  await page.getByRole("option", { name: "Workshop" }).click();

  // Date: hop to next month so the picked day is always in the future.
  await page.getByRole("button", { name: /Pick a date/i }).first().click();
  await page.getByRole("button", { name: /next month/i }).click();
  await page.getByRole("gridcell", { name: "15", exact: true }).last().click();
  await page.getByText("Select time", { exact: true }).first().click();
  await page.getByRole("option", { name: /10:00 AM/ }).first().click();

  await page.locator("#city").fill("Bengaluru");
  await page.locator("#location").fill("E2E Hall, Koramangala");

  await page.getByTestId("event-publish").click();
  await expect(page.getByText(/Event Published!/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/admin\/events/, { timeout: 15_000 });
});

test("a signed-in Yatri registers and the confirmation email is composed", async ({ page }) => {
  // Intercept the email API so the test asserts the real payload the app
  // sends (subject, recipient, registration code) without SMTP — works the
  // same under `npm run dev` (no /api backend) and in CI.
  let emailPayload: { to?: string; subject?: string; html?: string } | undefined;
  await page.route("**/api/send-email", async (route) => {
    emailPayload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });

  await page.goto(`/events/${upcoming!.slug}`);
  await expect(page.getByRole("heading", { name: upcoming!.name })).toBeVisible();

  await page.getByRole("button", { name: /Save my spot/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Register for ${upcoming!.name}`)).toBeVisible();

  await dialog.getByPlaceholder("John Doe").fill("E2E Test Yatri");
  await dialog.getByPlaceholder("john@example.com").fill(REG_EMAIL);
  await dialog.getByPlaceholder("+91 9876543210").fill("+91 9999999999");
  await dialog.getByPlaceholder("Bangalore").fill("Bengaluru");
  await dialog.getByPlaceholder("Karnataka").fill("Karnataka");
  await dialog.getByPlaceholder("India").fill("India");

  await dialog.getByRole("button", { name: /Complete Registration/i }).click();
  await expect(page.getByText(/You're in, Yatri/i)).toBeVisible({ timeout: 20_000 });

  // The confirmation email was composed for the right person and event, and
  // carries the registration code the attendee will present at check-in.
  expect(emailPayload?.to).toBe(REG_EMAIL);
  expect(emailPayload?.subject).toBe(`Registration Confirmed: ${upcoming!.name}`);
  expect(emailPayload?.html).toContain("E2E Test Yatri");
  // Fixture category is "Workshop", so codes look like WORKSHOP-A1B2C3.
  const codeMatch = emailPayload?.html?.match(/WORKSHOP-[A-Z0-9]{6}/);
  expect(codeMatch).toBeTruthy();
  regCode = codeMatch![0];
});

test("the registration appears in My Events", async ({ page }) => {
  await page.goto("/profile/my-events");
  await expect(
    page.getByRole("heading", { name: /My Registered Events/i })
  ).toBeVisible();
  await expect(page.getByText(upcoming!.name).first()).toBeVisible();
});

test("a sold-out event offers the waitlist and lets a Yatri join", async ({ page }) => {
  await page.goto(`/events/${soldOut!.slug}`);
  await expect(page.getByRole("heading", { name: soldOut!.name })).toBeVisible();

  await page.getByRole("button", { name: /Join the waitlist/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Join the waitlist for ${soldOut!.name}`)).toBeVisible();

  await dialog.getByPlaceholder("John Doe").fill("E2E Waitlist Yatri");
  await dialog.getByPlaceholder("john@example.com").fill(`e2e-wait-${Date.now()}@example.com`);
  await dialog.getByPlaceholder("+91 9876543210").fill("+91 8888888888");
  await dialog.getByRole("button", { name: /Join/i }).click();

  // Both a toast and the status panel say "You are on the waitlist" — assert
  // the panel via its unique companion action instead.
  await expect(page.getByText(/You are on the waitlist/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Leave the waitlist/i })).toBeVisible();
});

test("admin console lists the fixture with its row actions", async ({ page }) => {
  await page.goto("/admin/events");
  await page.getByTestId("events-search").fill(upcoming!.name);
  const row = page.getByTestId(`event-row-${upcoming!.slug}`);
  await expect(row).toBeVisible();

  await row.getByTestId("event-row-menu").click();
  await expect(page.getByTestId("event-menu-edit")).toBeVisible();
  await expect(page.getByTestId("event-menu-registrations")).toBeVisible();
  await expect(page.getByTestId("event-menu-delete")).toBeVisible();
});

test("registrations console shows the new attendee", async ({ page }) => {
  await page.goto(`/admin/events/${upcoming!.id}/registrations`);
  await expect(page.getByText(/Registrations/i).first()).toBeVisible();
  await expect(page.getByText(REG_EMAIL)).toBeVisible();
  await expect(page.getByText("E2E Test Yatri").first()).toBeVisible();
});

test("admin gallery console opens for a past event", async ({ page }) => {
  await page.goto("/admin/events");
  await page.getByTestId("events-tab-past").click();
  await page.getByTestId("events-search").fill(past!.name);
  const row = page.getByTestId(`event-row-${past!.slug}`);
  await expect(row).toBeVisible();

  await row.getByTestId("event-row-menu").click();
  await page.getByTestId("event-menu-gallery").click();
  await expect(page).toHaveURL(/\/event\/.+\/media/);
  await expect(
    page.getByRole("heading", { name: new RegExp(`Event Gallery — ${past!.name}`) })
  ).toBeVisible();
  await expect(page.getByTestId("gallery-upload-btn")).toBeVisible();
});

test("a past event's gallery unlocks for admins", async ({ page }) => {
  await page.goto(`/events/${past!.slug}`);
  await expect(page.getByRole("heading", { name: past!.name })).toBeVisible();
  await page.getByRole("button", { name: /^Gallery$/i }).click();
  // Admins pass the attendees-only gate; with no uploads yet the friendly
  // empty state shows instead of the locked panel.
  await expect(page.getByText(/Photos and highlights from this one are on the way/i)).toBeVisible();
  await expect(page.getByTestId("gallery-locked")).toHaveCount(0);
});

test("attendee check-in verifies the code and confirms attendance", async ({ page }) => {
  expect(regCode, "registration test must run first and capture the code").toBeTruthy();

  await page.goto("/admin/attendees");
  await expect(page.getByRole("heading", { name: /Attendee Verification/i })).toBeVisible();

  await page.getByPlaceholder("EVT-XXXX1234").fill(regCode!);
  await page.getByRole("button", { name: /Verify/i }).click();

  await expect(page.getByRole("heading", { name: "E2E Test Yatri" })).toBeVisible();
  await expect(page.getByText(/Pending Check-in/i)).toBeVisible();
  await expect(page.getByText(REG_EMAIL)).toBeVisible();

  await page.getByRole("button", { name: /Confirm Attendance/i }).click();
  await expect(
    page.getByRole("heading", { name: /Check-in Successful/i })
  ).toBeVisible({ timeout: 15_000 });

  // Verifying the same code again must flag the duplicate, not re-admit.
  await page.reload();
  await page.getByPlaceholder("EVT-XXXX1234").fill(regCode!);
  await page.getByRole("button", { name: /Verify/i }).click();
  await expect(page.getByText(/Already Checked In/i).first()).toBeVisible();
});

test("a venue proposal flows from the public form to admin approval", async ({ page }) => {
  const venueName = `E2E Venue ${Date.now()}`;

  await page.goto(`/upcoming-event/${upcoming!.slug}/venue`);
  await expect(page.getByRole("heading", { name: /Propose a Venue/i })).toBeVisible();

  await page.getByLabel(/Venue Name/i).fill(venueName);
  await page.getByLabel(/Complete Address/i).fill("42 E2E Street, Bengaluru, Karnataka 560001");
  await page.getByLabel(/Seating Capacity/i).fill("120");
  await page.getByLabel(/Your Name/i).fill("E2E Venue Owner");
  await page.getByLabel(/Your Email/i).fill(`e2e-venue-${Date.now()}@example.com`);
  await page.getByRole("button", { name: /Submit/i }).click();
  await expect(page.getByText(/Venue Proposal Submitted/i).first()).toBeVisible({ timeout: 15_000 });

  // Admin reviews and approves it.
  await page.goto("/admin/submissions");
  await expect(page.getByRole("heading", { name: /Event Submissions/i })).toBeVisible();
  await expect(page.getByText(venueName).first()).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /Approve Only/i }).first().click();
  await expect(page.getByText(/Approved!/i).first()).toBeVisible({ timeout: 15_000 });
});

test("admin deletes the event from the console", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/admin/events");
  await page.getByTestId("events-search").fill(upcoming!.name);
  const row = page.getByTestId(`event-row-${upcoming!.slug}`);
  await expect(row).toBeVisible();

  await row.getByTestId("event-row-menu").click();
  await page.getByTestId("event-menu-delete").click();

  await expect(page.getByText(/Event Deleted/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(row).toHaveCount(0);
});
