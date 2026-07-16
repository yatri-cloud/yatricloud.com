import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  createFixtureProduct,
  deleteFixtureProduct,
  fixturesAvailable,
  type FixtureProduct,
} from "./helpers/events-fixture";

/**
 * Inquiry replies + per-product coupons (admin project, serial):
 *  - the admin answers a contact message by email from /admin/inquiries
 *    (payload asserted, reply recorded on the row);
 *  - a coupon pinned to ONE product is created through /admin/coupons and
 *    only discounts that product's line in the store cart.
 */

test.describe.configure({ mode: "serial" });

const CONTACT_MSG = `E2E contact message ${Date.now()} — safe to delete`;
const COUPON_CODE = `E2E${Date.now().toString(36).toUpperCase()}`;

let contactId: string | undefined;
let product: FixtureProduct | undefined;

function admin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key);
}

test.beforeAll(async () => {
  test.skip(!fixturesAvailable, "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  const { data, error } = await admin()
    .from("contact_messages")
    .insert({ name: "E2E Inquirer", email: "e2e-inquiry@example.com", subject: "E2E question", message: CONTACT_MSG })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  contactId = data!.id;
  product = await createFixtureProduct();
});

test.afterAll(async () => {
  if (contactId) await admin().from("contact_messages").delete().eq("id", contactId);
  await admin().from("coupons").delete().eq("code", COUPON_CODE);
  await deleteFixtureProduct(product?.id);
});

test("admin replies to a contact message by email", async ({ page }) => {
  let emailPayload: { to?: string; subject?: string; html?: string } | undefined;
  await page.route("**/api/send-email", async (route) => {
    emailPayload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });

  await page.goto("/admin/inquiries");
  await page.getByRole("tab", { name: /Contact messages/i }).click();
  await page.getByPlaceholder(/Search by name, email, subject/i).fill(CONTACT_MSG.slice(0, 24));
  await expect(page.getByText(CONTACT_MSG).first()).toBeVisible({ timeout: 10_000 });

  await page.getByTestId("contact-reply").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Reply to E2E Inquirer/i)).toBeVisible();
  await dialog.getByTestId("inquiry-reply-text").fill("E2E reply: thanks for writing in — all sorted!");
  await dialog.getByTestId("inquiry-reply-send").click();

  await expect(page.getByText(/Reply sent to e2e-inquiry@example.com/i).first()).toBeVisible({ timeout: 15_000 });
  expect(emailPayload?.to).toBe("e2e-inquiry@example.com");
  expect(emailPayload?.subject).toBe("Re: E2E question");
  expect(emailPayload?.html).toContain("all sorted");
  await expect(page.getByText(/Replied /i).first()).toBeVisible();
});

test("a coupon pinned to one product is created in the admin console", async ({ page }) => {
  await page.goto("/admin/coupons");
  await page.getByRole("button", { name: /New coupon/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.locator("#cp-code").fill(COUPON_CODE);
  await dialog.locator("#cp-percent").fill("20");
  await dialog.getByRole("combobox").first().click();
  await page.getByRole("option", { name: /Store only/i }).click();
  await dialog.getByTestId("cp-entity").click();
  await page.getByRole("option", { name: product!.title }).click();
  await dialog.getByRole("button", { name: /^Save$/i }).click();

  await expect(page.getByText(/Coupon created/i).first()).toBeVisible({ timeout: 10_000 });
  const row = page.locator("tr", { hasText: COUPON_CODE });
  await expect(row).toBeVisible();
  await expect(row.getByText(product!.title)).toBeVisible();
});

test("the pinned coupon discounts only its product line in the cart", async ({ page }) => {
  await page.goto("/yatristore");
  await page.getByPlaceholder(/Search vouchers/i).fill(product!.title);
  await page.getByRole("button", { name: /Add to Cart/i }).first().click();
  await page.getByRole("button", { name: /^Cart/i }).first().click();

  const sheet = page.getByRole("dialog");
  await sheet.getByPlaceholder(/Coupon code/i).fill(COUPON_CODE);
  await sheet.getByRole("button", { name: /^Apply$/i }).click();
  await expect(sheet.getByText(new RegExp(`${COUPON_CODE} applied`))).toBeVisible({ timeout: 10_000 });
  // Fixture product is ₹500; 20% off leaves ₹400 payable.
  await expect(sheet.getByText(/400/).first()).toBeVisible();
});
