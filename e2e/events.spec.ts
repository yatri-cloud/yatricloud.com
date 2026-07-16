import { test, expect } from "@playwright/test";
import {
  createFixtureEvent,
  deleteFixtureEvent,
  fixturesAvailable,
  type FixtureEvent,
} from "./helpers/events-fixture";

/**
 * Events — public (unauthenticated) journey.
 *
 * Listing/search tests are non-mutating and run against whatever real events
 * exist. The auth-gating and gallery-lock tests need a deterministic event, so
 * they use private throwaway fixtures (see helpers/events-fixture.ts) that are
 * invisible in listings and deleted afterwards.
 */

test.describe("Events — public listing", () => {
  test("listing renders with hero, search, and category chips", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: /Where Yatris/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search events/i)).toBeVisible();
    // "All" chip comes first; the rest come from the event_category option list.
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
  });

  test("search shows the friendly empty state on no match", async ({ page }) => {
    await page.goto("/events");
    await page.getByPlaceholder(/Search events/i).fill("zzz-no-such-event-xyz");
    await expect(page.getByText(/No events match that just yet, Yatri/i)).toBeVisible();
  });

  test("an event card opens its detail page", async ({ page }) => {
    await page.goto("/events");
    // Cards render after the events fetch — wait for one before deciding to skip.
    const card = page.locator('a[href^="/events/"]').first();
    await card.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if ((await card.count()) === 0) test.skip(true, "no published events to open");
    await card.click();
    await expect(page).toHaveURL(/\/events\/.+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("my-events prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/profile/my-events");
    await expect(page.getByText(/Please sign in first/i)).toBeVisible();
    // The CTA opens the in-app login modal (a /login route does not exist).
    await page.getByRole("button", { name: /Sign in to continue/i }).click();
    await expect(page.getByText(/Welcome Back!/i)).toBeVisible();
  });
});

test.describe("Events — anonymous gating (fixture-backed)", () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");

  let upcoming: FixtureEvent | undefined;
  let past: FixtureEvent | undefined;

  test.beforeAll(async () => {
    [upcoming, past] = await Promise.all([
      createFixtureEvent({ when: "upcoming" }),
      createFixtureEvent({ when: "past" }),
    ]);
  });

  test.afterAll(async () => {
    await Promise.all([deleteFixtureEvent(upcoming?.id), deleteFixtureEvent(past?.id)]);
  });

  test("registering while logged out opens the sign-in modal", async ({ page }) => {
    await page.goto(`/events/${upcoming!.slug}`);
    await expect(page.getByRole("heading", { name: upcoming!.name })).toBeVisible();
    await page.getByRole("button", { name: /Save my spot/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/Welcome Back!/i)).toBeVisible();
  });

  test("a past event's gallery is locked for visitors", async ({ page }) => {
    await page.goto(`/events/${past!.slug}`);
    await expect(page.getByRole("heading", { name: past!.name })).toBeVisible();
    await page.getByRole("button", { name: /^Gallery$/i }).click();
    await expect(page.getByTestId("gallery-locked")).toBeVisible();
    await expect(page.getByText(/Only Yatris who attended this event/i)).toBeVisible();
  });

  test("a private event never appears in the public listing", async ({ page }) => {
    await page.goto("/events");
    await page.getByPlaceholder(/Search events/i).fill(upcoming!.name);
    await expect(page.getByText(/No events match that just yet, Yatri/i)).toBeVisible();
  });
});

test.describe("Events — feedback form", () => {
  test("feedback page renders its star rating", async ({ page }) => {
    await page.goto("/events/E2E%20Throwaway%20Feedback/feedback");
    await expect(page.getByText(/Overall Rating/i)).toBeVisible();
  });
});
