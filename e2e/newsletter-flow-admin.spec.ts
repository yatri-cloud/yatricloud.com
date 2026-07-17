import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Newsletter system -- full lifecycle E2E (admin project, serial):
 *
 *   1. Subscriber appears in admin list
 *   2. Admin composes a newsletter draft
 *   3. Newsletter draft appears in list
 *   4. Admin sends newsletter (email intercepted)
 *   5. Newsletter shows as sent in list
 *   6. Subscriber status unchanged (still active)
 *   7. Unsubscribe via token link
 *   8. Subscriber now shows as unsubscribed in admin
 *   9. Public footer subscribe flow
 *  10. Duplicate subscribe handled gracefully
 *  11. Invalid unsubscribe token shows error
 */

test.describe.configure({ mode: "serial" });

const RUN = Date.now().toString(36);
const SUBSCRIBER_EMAIL = `e2e-newsletter-${RUN}@example.com`;
const SUBSCRIBER_NAME = `E2E Yatri ${RUN}`;
const NEWSLETTER_TITLE = `E2E Newsletter ${RUN}`;
const NEWSLETTER_SUBJECT = `Test Newsletter ${RUN}`;
const NEWSLETTER_BODY = `<p>Hello Yatris! This is test newsletter ${RUN}.</p>`;

const fixturesAvailable = Boolean(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Intercept /api/send-email and collect every payload. */
async function interceptEmails(page: Page) {
  const sent: { to?: string; subject?: string; html?: string }[] = [];
  await page.route("**/api/send-email", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    });
  });
  return sent;
}

/** Service-role client for fixture setup / teardown. */
function getDb() {
  const url =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let subscriberId: string | undefined;
let unsubscribeToken: string | undefined;

test.beforeAll(async () => {
  test.skip(
    !fixturesAvailable,
    "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set",
  );

  const db = getDb();
  const { data } = await db
    .from("subscribers")
    .insert({ email: SUBSCRIBER_EMAIL, name: SUBSCRIBER_NAME })
    .select("id, unsubscribe_token")
    .single();

  subscriberId = data?.id;
  unsubscribeToken = data?.unsubscribe_token as string | undefined;
});

test.afterAll(async () => {
  if (!fixturesAvailable) return;
  const db = getDb();

  // Cleanup any newsletters created during this test run
  const { data: nls } = await db
    .from("newsletters")
    .select("id")
    .ilike("title", "E2E Newsletter%");

  if (nls) {
    for (const nl of nls) {
      await db.from("newsletter_sends").delete().eq("newsletter_id", nl.id);
      await db.from("newsletters").delete().eq("id", nl.id);
    }
  }

  // Cleanup test subscribers
  if (subscriberId) {
    await db.from("subscribers").delete().eq("id", subscriberId);
  }
  // Also cleanup footer-subscribe test subscriber (catch cleanup if test 9 failed)
  await db
    .from("subscribers")
    .delete()
    .ilike("email", `e2e-footer-${RUN}%`);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("1. subscriber appears in admin list", async ({ page }) => {
  await page.goto("/admin/subscribers");
  await page
    .getByTestId("subscribers-search")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("subscribers-search").fill(SUBSCRIBER_EMAIL);
  await expect(page.getByText(SUBSCRIBER_EMAIL)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(SUBSCRIBER_NAME)).toBeVisible();
});

test("2. admin composes a newsletter draft", async ({ page }) => {
  await page.goto("/admin/newsletters/new");
  await page
    .getByTestId("newsletter-title")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("newsletter-title").fill(NEWSLETTER_TITLE);
  await page.getByTestId("newsletter-subject").fill(NEWSLETTER_SUBJECT);
  await page.getByTestId("newsletter-body").fill(NEWSLETTER_BODY);
  await page.getByTestId("newsletter-save-draft").click();

  // Compose page shows "Done" / "Newsletter saved as draft." then redirects
  await expect(page.getByText(/saved as draft/i)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page).toHaveURL(/\/admin\/newsletters\/edit\//, {
    timeout: 10_000,
  });
});

test("3. newsletter draft appears in list", async ({ page }) => {
  await page.goto("/admin/newsletters");
  await page
    .getByTestId("newsletters-search")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("newsletters-search").fill(NEWSLETTER_TITLE);
  await expect(page.getByText(NEWSLETTER_TITLE)).toBeVisible({
    timeout: 10_000,
  });
  // Verify the send button is visible for the draft
  const sendBtn = page.getByTestId("newsletter-send").first();
  await expect(sendBtn).toBeVisible();
});

test("4. admin sends newsletter (email intercepted)", async ({ page }) => {
  const sent = await interceptEmails(page);

  await page.goto("/admin/newsletters");
  await page
    .getByTestId("newsletters-search")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("newsletters-search").fill(NEWSLETTER_TITLE);

  // Click send on the draft row
  const sendBtn = page.getByTestId("newsletter-send").first();
  await expect(sendBtn).toBeVisible({ timeout: 10_000 });
  await sendBtn.click();

  // The send confirmation AlertDialog opens -- click "Send to All"
  const confirmBtn = page.getByRole("button", { name: /send to all/i });
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();

  // Wait for at least one email to be sent to our test subscriber
  await expect
    .poll(
      () => sent.some((e) => e.to === SUBSCRIBER_EMAIL),
      { timeout: 30_000 },
    )
    .toBe(true);

  // Verify the email content
  const email = sent.find((e) => e.to === SUBSCRIBER_EMAIL);
  expect(email?.subject).toBe(NEWSLETTER_SUBJECT);
  expect(email?.html).toContain("Hello Yatris!");
  expect(email?.html).toContain("Unsubscribe");
});

test("5. newsletter shows as sent in list", async ({ page }) => {
  await page.goto("/admin/newsletters");
  await page
    .getByTestId("newsletters-search")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("newsletters-search").fill(NEWSLETTER_TITLE);

  // The row should now show "sent" status
  const row = page.locator("tr", { hasText: NEWSLETTER_TITLE }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row.getByText(/sent/i)).toBeVisible({ timeout: 10_000 });
});

test("6. subscriber status unchanged (still active)", async ({ page }) => {
  await page.goto("/admin/subscribers");
  await page
    .getByTestId("subscribers-search")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("subscribers-search").fill(SUBSCRIBER_EMAIL);

  // The "active" tab is the default -- verify subscriber row shows "active"
  const row = page
    .getByTestId(`subscriber-row-${SUBSCRIBER_EMAIL}`)
    .first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row.getByText("active")).toBeVisible();
});

test("7. unsubscribe via token link", async ({ page }) => {
  test.skip(!unsubscribeToken, "No unsubscribe token available");

  // Suppress any outgoing emails during this test
  await page.route("**/api/send-email", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    }),
  );

  await page.goto(`/unsubscribe?token=${unsubscribeToken}`);
  await expect(page.getByText(/unsubscribed/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("8. subscriber now shows as unsubscribed in admin", async ({ page }) => {
  await page.goto("/admin/subscribers");
  await page
    .getByTestId("subscribers-search")
    .waitFor({ state: "visible", timeout: 15_000 });

  // Switch to the "Unsubscribed" tab
  await page.getByTestId("subscribers-tab-unsubscribed").click();
  await page.getByTestId("subscribers-search").fill(SUBSCRIBER_EMAIL);
  await expect(page.getByText(SUBSCRIBER_EMAIL)).toBeVisible({
    timeout: 10_000,
  });
});

test("9. public footer subscribe flow", async ({ page }) => {
  const footerEmail = `e2e-footer-${RUN}@example.com`;
  const sent = await interceptEmails(page);

  await page.goto("/");
  // Scroll to the footer subscribe form
  const emailInput = page.locator("#footer-subscribe");
  await emailInput.scrollIntoViewIfNeeded();
  await emailInput.fill(footerEmail);

  // Fill optional name if present
  const nameInput = page.locator("#footer-name");
  if (
    (await nameInput.isVisible({ timeout: 2000 }).catch(() => false))
  ) {
    await nameInput.fill("Footer Test Yatri");
  }

  await page.locator('button[aria-label="Subscribe for updates"]').click();

  // The success toast shows "You're in, Yatri!"
  await expect(page.getByText(/you're in/i)).toBeVisible({
    timeout: 10_000,
  });

  // Wait briefly for the non-blocking welcome email to fire
  await page.waitForTimeout(2000);

  // Cleanup: delete this subscriber via service role
  const db = getDb();
  await db.from("subscribers").delete().eq("email", footerEmail);
});

test("10. duplicate subscribe is handled gracefully", async ({ page }) => {
  await page.goto("/");
  const emailInput = page.locator("#footer-subscribe");
  await emailInput.scrollIntoViewIfNeeded();
  await emailInput.fill(SUBSCRIBER_EMAIL); // already exists (from beforeAll)

  await page.locator('button[aria-label="Subscribe for updates"]').click();

  // Should still show success toast (duplicate handled silently)
  await expect(page.getByText(/you're in/i)).toBeVisible({
    timeout: 10_000,
  });
});

test("11. invalid unsubscribe token shows error", async ({ page }) => {
  await page.goto("/unsubscribe?token=invalid-token-12345");
  await expect(page.getByText(/expired|invalid/i)).toBeVisible({
    timeout: 10_000,
  });
});
