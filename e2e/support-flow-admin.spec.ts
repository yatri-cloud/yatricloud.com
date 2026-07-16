import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Support tickets — the whole lifecycle through the UI (admin project,
 * serial): open a ticket (confirmation email asserted), see it in My
 * Tickets, work it in the admin queue (internal note, reply → "Waiting on
 * Yatri" + email, resolve + email), reply as the Yatri (auto-reopen), and
 * close it as solved. Cleanup removes the ticket (messages cascade).
 */

test.describe.configure({ mode: "serial" });

const SUBJECT = `E2E support ticket ${Date.now()} — safe to delete`;
let ticketNumber: string | undefined;

/** Collects every /api/send-email payload on the page. */
async function interceptEmails(page: import("@playwright/test").Page) {
  const sent: { to?: string; subject?: string; html?: string }[] = [];
  await page.route("**/api/send-email", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });
  return sent;
}

test.afterAll(async () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (url && key) {
    await createClient(url, key).from("support_tickets").delete().eq("subject", SUBJECT);
  }
});

test("a Yatri opens a ticket and gets a numbered confirmation email", async ({ page }) => {
  const sent = await interceptEmails(page);

  await page.goto("/support");
  await expect(page.getByRole("heading", { name: /We've got your back, Yatri/i })).toBeVisible();

  await page.getByTestId("ticket-new").click();
  const dialog = page.getByRole("dialog");
  await dialog.getByTestId("ticket-category").click();
  await page.getByRole("option", { name: /Payments & refunds/i }).click();
  await dialog.getByTestId("ticket-subject").fill(SUBJECT);
  await dialog.getByTestId("ticket-message").fill("E2E: payment went through twice, please check. Safe to delete.");
  await dialog.getByTestId("ticket-submit").click();

  await expect(page.getByText(/Ticket TKT-\d+ is in/i).first()).toBeVisible({ timeout: 15_000 });

  await expect
    .poll(() => sent.some((e) => /We got your ticket TKT-\d+/.test(e.subject || "")), { timeout: 10_000 })
    .toBe(true);
  const confirmation = sent.find((e) => /We got your ticket/.test(e.subject || ""));
  ticketNumber = confirmation!.subject!.match(/TKT-\d+/)![0];
  // The support inbox is notified too.
  expect(sent.some((e) => e.subject?.startsWith(`New support ticket ${ticketNumber}`))).toBe(true);
});

test("the ticket shows in My Tickets and its thread opens", async ({ page }) => {
  await page.goto("/support");
  const row = page.getByRole("link", { name: new RegExp(ticketNumber!) });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.click();

  await expect(page).toHaveURL(new RegExp(`/support/${ticketNumber}`));
  await expect(page.getByRole("heading", { name: SUBJECT })).toBeVisible();
  await expect(page.getByTestId("ticket-status")).toHaveText(/Open/i);
  await expect(page.getByTestId("ticket-thread").getByText(/payment went through twice/i)).toBeVisible();
});

test("admin works the queue: internal note, reply, resolve — with emails", async ({ page }) => {
  const sent = await interceptEmails(page);

  await page.goto("/admin/tickets");
  await page.getByTestId("tickets-search").fill(ticketNumber!);
  await page.getByTestId(`ticket-row-${ticketNumber}`).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(SUBJECT)).toBeVisible();

  // Internal note — never emailed, highlighted in the thread.
  await dialog.getByTestId("ticket-admin-internal").click();
  await dialog.getByTestId("ticket-admin-reply").fill("E2E internal note: refund verified in Razorpay.");
  await dialog.getByTestId("ticket-admin-send").click();
  await expect(dialog.getByText(/Internal note/i).first()).toBeVisible({ timeout: 10_000 });
  expect(sent.length).toBe(0);

  // Real reply — emails the Yatri and flips the ticket to Waiting on Yatri.
  await dialog.getByTestId("ticket-admin-reply").fill("E2E reply: the duplicate charge is reversed, allow 3-5 days.");
  await dialog.getByTestId("ticket-admin-send").click();
  await expect
    .poll(() => sent.some((e) => e.subject === `Re: [${ticketNumber}] ${SUBJECT}`), { timeout: 10_000 })
    .toBe(true);

  // Resolve — emails the Yatri.
  await dialog.getByTestId("ticket-admin-status").click();
  await page.getByRole("option", { name: /^Resolved$/i }).click();
  await expect
    .poll(() => sent.some((e) => e.subject === `Resolved: [${ticketNumber}] ${SUBJECT}`), { timeout: 10_000 })
    .toBe(true);
});

test("a Yatri reply on a resolved ticket reopens it automatically", async ({ page }) => {
  await page.route("**/api/send-email", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" })
  );
  await page.goto(`/support/${ticketNumber}`);
  await expect(page.getByTestId("ticket-status")).toHaveText(/Resolved/i);
  await expect(page.getByText(/duplicate charge is reversed/i)).toBeVisible();

  await page.getByTestId("ticket-reply").fill("E2E: still seeing the charge on my statement.");
  await page.getByTestId("ticket-send").click();
  await expect(page.getByText(/Reply sent/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("ticket-status")).toHaveText(/^Open$/i, { timeout: 10_000 });
});

test("the Yatri closes their own ticket as solved and gets a closing email", async ({ page }) => {
  const sent = await interceptEmails(page);
  await page.goto(`/support/${ticketNumber}`);
  await page.getByTestId("ticket-close").click();
  await expect(page.getByText(/This ticket is closed/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("ticket-status")).toHaveText(/Closed/i);
  await expect
    .poll(() => sent.some((e) => e.subject === `Closed: [${ticketNumber}] ${SUBJECT}`), { timeout: 10_000 })
    .toBe(true);
});
