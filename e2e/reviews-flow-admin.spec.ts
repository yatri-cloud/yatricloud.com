import { test, expect } from "@playwright/test";
import {
  createFixtureEvent,
  createFixtureProduct,
  deleteEntityReviewsFor,
  deleteFixtureEvent,
  deleteFixtureProduct,
  fixturesAvailable,
  getUserIdByEmail,
  seedRegistration,
  type FixtureEvent,
  type FixtureProduct,
} from "./helpers/events-fixture";

/**
 * Unified content reviews (migration 075) — both ends, via the UI:
 *  - a registered Yatri reviews an EVENT from the detail page's Reviews tab
 *    (RLS: only registered Yatris may review an event);
 *  - a signed-in Yatri reviews a STORE PRODUCT from its details dialog;
 *  - the admin Content Reviews console filters, hides, and deletes them.
 * Runs under the `admin` project (signed-in session), serial.
 */

test.describe.configure({ mode: "serial" });

const EVENT_REVIEW = `E2E event review ${Date.now()} — great vibes, safe to delete.`;
const PRODUCT_REVIEW = `E2E product review ${Date.now()} — instant delivery, safe to delete.`;

let pastEvent: FixtureEvent | undefined;
let product: FixtureProduct | undefined;

test.beforeAll(async () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  [pastEvent, product] = await Promise.all([
    createFixtureEvent({ when: "past" }),
    createFixtureProduct(),
  ]);
  // Register the signed-in e2e admin for the event so the RLS gate lets
  // them review it.
  const adminId = await getUserIdByEmail(process.env.E2E_ADMIN_EMAIL || "");
  if (!adminId) throw new Error("could not resolve the e2e admin profile id");
  await seedRegistration(pastEvent.id, process.env.E2E_ADMIN_EMAIL!, adminId);
});

test.afterAll(async () => {
  await deleteEntityReviewsFor(pastEvent?.id);
  await deleteEntityReviewsFor(product?.id);
  await Promise.all([deleteFixtureEvent(pastEvent?.id), deleteFixtureProduct(product?.id)]);
});

test("a registered Yatri reviews an event from its Reviews tab", async ({ page }) => {
  await page.goto(`/events/${pastEvent!.slug}`);
  await expect(page.getByRole("heading", { name: pastEvent!.name })).toBeVisible();

  await page.getByRole("button", { name: /^Reviews$/i }).click();
  await page.getByTestId("entity-review-write").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(`Review ${pastEvent!.name}`)).toBeVisible();
  await dialog.getByTestId("entity-review-rating-4").click();
  await dialog.getByTestId("entity-review-text").fill(EVENT_REVIEW);
  await dialog.getByTestId("entity-review-submit").click();

  await expect(page.getByText(/Thank you, Yatri/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("entity-reviews-list").getByText(EVENT_REVIEW)).toBeVisible();
});

test("a signed-in Yatri reviews a store product from its details dialog", async ({ page }) => {
  await page.goto("/yatristore");
  await page.getByPlaceholder(/Search vouchers/i).fill(product!.title);
  await page.getByRole("button", { name: /View Details/i }).first().click();

  const details = page.getByRole("dialog");
  await expect(details.getByText(/Ratings & reviews/i)).toBeVisible();
  await details.getByTestId("entity-review-write").click();

  // The write dialog stacks on top of the details dialog.
  await expect(page.getByText(`Review ${product!.title}`)).toBeVisible();
  await page.getByTestId("entity-review-rating-5").click();
  await page.getByTestId("entity-review-text").fill(PRODUCT_REVIEW);
  await page.getByTestId("entity-review-submit").click();

  await expect(page.getByText(/Thank you, Yatri/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(details.getByText(PRODUCT_REVIEW)).toBeVisible();
});

test("the admin content-reviews console moderates both reviews", async ({ page }) => {
  await page.goto("/admin/content-reviews");
  await expect(page.getByRole("heading", { name: /Content/i }).first()).toBeVisible();

  const search = page.getByTestId("content-reviews-search");
  await search.fill(EVENT_REVIEW.slice(0, 30));
  await expect(page.getByText(EVENT_REVIEW).first()).toBeVisible({ timeout: 10_000 });

  // Hide, then show again.
  await page.getByRole("button", { name: /^Hide$/i }).first().click();
  await expect(page.getByRole("button", { name: /^Show$/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /^Show$/i }).first().click();
  await expect(page.getByRole("button", { name: /^Hide$/i }).first()).toBeVisible();

  // Delete the product review through the confirm dialog.
  await search.fill(PRODUCT_REVIEW.slice(0, 30));
  await expect(page.getByText(PRODUCT_REVIEW).first()).toBeVisible();
  await page.getByRole("button", { name: /Delete the review by/i }).first().click();
  await page.getByRole("button", { name: /^Delete$/i }).click();
  await expect(page.getByText(PRODUCT_REVIEW)).toHaveCount(0, { timeout: 10_000 });
});
