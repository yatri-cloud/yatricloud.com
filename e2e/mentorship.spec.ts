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
 * Mentorship — public (unauthenticated) journey against throwaway fixtures.
 * Booking itself needs a session and lives in mentorship-flow-admin.spec.ts.
 */

test.describe("Mentorship — public", () => {
  test("directory renders with search and apply CTA", async ({ page }) => {
    await page.goto("/mentorship");
    await expect(
      page.getByRole("heading", { name: /Learn from people who have already made it/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search by name, headline or expertise/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Apply here/i })).toBeVisible();
  });

  test("my bookings prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/mentorship/bookings");
    await expect(page.getByRole("heading", { name: /Your bookings live here/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sign in$/i })).toBeVisible();
  });
});

test.describe("Mentorship — fixture mentor (anonymous)", () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");

  let mentor: FixtureMentor | undefined;
  let service: FixtureService | undefined;

  test.beforeAll(async () => {
    mentor = await createFixtureMentor();
    service = await createFixtureService(mentor.id, "digital");
  });

  test.afterAll(async () => {
    await deleteFixtureMentor(mentor?.id);
  });

  test("a published mentor appears in the directory and opens a profile", async ({ page }) => {
    await page.goto("/mentorship");
    await page.getByPlaceholder(/Search by name, headline or expertise/i).fill(mentor!.name);
    await page.getByRole("link", { name: new RegExp(mentor!.name) }).click();
    await expect(page.getByRole("heading", { name: mentor!.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Book a session/i })).toBeVisible();
  });

  test("a service opens and booking asks visitors to sign in", async ({ page }) => {
    await page.goto(`/mentorship/${mentor!.slug}/${service!.slug}`);
    await expect(page.getByRole("heading", { name: service!.title })).toBeVisible();

    await page.getByLabel(/Full name/i).fill("E2E Anonymous Yatri");
    await page.getByLabel(/^Email$/i).fill("e2e-anon@example.com");
    const bookBtn = page.getByRole("button", { name: /Sign in to book/i });
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();
    await expect(page.getByText(/Welcome Back!/i)).toBeVisible();
  });
});
