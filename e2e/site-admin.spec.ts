import { test, expect } from "@playwright/test";

/**
 * Admin console smokes — authenticated (runs under the `admin` project).
 * Every admin surface outside events/training/mentorship (those have their
 * own suites) renders its real heading + a key control. Catches broken lazy
 * chunks, crashed pages, and empty-table regressions across the console.
 */

test("overview dashboard renders", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /^Overview/i })).toBeVisible();
  await expect(page.getByText(/This month/i).first()).toBeVisible();
});

test("site & homepage editor renders", async ({ page }) => {
  await page.goto("/admin/site");
  await expect(page.getByRole("heading", { name: /Site & Homepage/i })).toBeVisible();
});

test("certification catalog renders with search", async ({ page }) => {
  await page.goto("/admin/certifications");
  await expect(page.getByRole("heading", { name: /Certification Catalog/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Search by name or exam code/i)).toBeVisible();
});

test("inquiries console renders both queues", async ({ page }) => {
  await page.goto("/admin/inquiries");
  await expect(page.getByRole("heading", { name: /^Inquiries/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Search by name, email, company/i)).toBeVisible();
});

test("payments, transactions, and invoices consoles render", async ({ page }) => {
  await page.goto("/admin/payments");
  await expect(page.getByRole("heading", { name: /Payments and revenue/i })).toBeVisible();

  await page.goto("/admin/transactions");
  await expect(page.getByRole("heading", { name: /^Transactions/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Search id, email, method/i)).toBeVisible();

  await page.goto("/admin/razorpay-invoices");
  await expect(page.getByRole("heading", { name: /Razorpay invoices/i })).toBeVisible();
});

test("udemy admin renders its form", async ({ page }) => {
  await page.goto("/admin/udemy");
  await expect(page.getByRole("heading", { name: /Add Udemy Course/i })).toBeVisible();
  await expect(
    page.getByPlaceholder(/AWS Certified Solutions Architect/i).first()
  ).toBeVisible();
});

test("community links console renders with search", async ({ page }) => {
  await page.goto("/admin/community");
  await expect(page.getByRole("heading", { name: /^Community/i }).first()).toBeVisible();
  await expect(page.getByPlaceholder(/Search links/i)).toBeVisible();
});

test("achievements console renders with search", async ({ page }) => {
  await page.goto("/admin/achievements");
  await expect(page.getByRole("heading", { name: /^Achievements/i }).first()).toBeVisible();
  await expect(page.getByPlaceholder(/Search name, email, cert/i)).toBeVisible();
});

test("review moderation renders and filters work", async ({ page }) => {
  await page.goto("/admin/reviews");
  await expect(page.getByRole("heading", { name: /Moderate the review wall/i })).toBeVisible();
  const search = page.getByPlaceholder(/Search reviews or names/i);
  await search.fill("zzz-no-such-review-xyz");
  await expect(page.getByText(/No reviews match/i)).toBeVisible();
});

test("resume requests console renders with search", async ({ page }) => {
  await page.goto("/admin/resumes");
  await expect(page.getByRole("heading", { name: /Resume requests/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Search by name, email or error/i)).toBeVisible();
});

test("jobs companies console renders with search", async ({ page }) => {
  await page.goto("/admin/jobs");
  await expect(page.getByRole("heading", { name: /^Companies/i })).toBeVisible();
  await expect(page.getByPlaceholder(/Search companies/i)).toBeVisible();
});

test("admin sitemap lists the console navigation", async ({ page }) => {
  await page.goto("/admin/sitemap");
  await expect(page.getByRole("heading", { name: /Admin sitemap/i })).toBeVisible();
});
