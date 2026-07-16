import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Training — the full production journey, driven through the UI end to end
 * (authenticated `admin` project, serial):
 *
 *   publish guard → build + PUBLISH a course in the admin builder → it shows
 *   on the public catalog → free enrollment (confirmation email payload
 *   asserted via /api/send-email interception) → detail page remembers the
 *   enrollment after reload → student dashboard lesson completion →
 *   My Trainings → /admin/enrollments → UI delete.
 *
 * The course is created through the real builder (not a DB fixture) so the
 * publish path itself is under test. A service-role afterAll removes any
 * leftovers if a step fails midway.
 */

test.describe.configure({ mode: "serial" });

const RUN = Date.now().toString(36);
const COURSE = `[E2E] Flow Course ${RUN}`;

let publicSlug: string | undefined;

test.afterAll(async () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return;
  // Backstop: enrollments/modules/lessons cascade from the training row.
  await createClient(url, key).from("trainings").delete().eq("course_title", COURSE);
});

test("publishing without a course name is blocked", async ({ page }) => {
  await page.goto("/admin/training/create");
  // The publish button lives on the final Review tab.
  await page.getByTestId("builder-tab-Review").click();
  await page.getByTestId("builder-publish").click();
  await expect(page.getByText(/Add a course name before publishing/i)).toBeVisible();
});

test("the builder publishes a course live", async ({ page }) => {
  await page.goto("/admin/training/create");

  await page.getByTestId("builder-type-trigger").click();
  await page.getByRole("option", { name: "Certification" }).click();
  await page.getByTestId("builder-course-name").fill(COURSE);
  await page.getByTestId("builder-description").fill("[E2E] Created by Playwright. Safe to delete.");

  await page.getByTestId("builder-tab-Details").click();
  await page.getByTestId("builder-duration").fill("6 hours");
  await page.getByTestId("builder-level-trigger").click();
  await page.getByRole("option", { name: "Beginner" }).click();
  await page.getByTestId("builder-skills").fill("Playwright, E2E testing");

  await page.getByTestId("builder-tab-Curriculum").click();
  await page.getByTestId("builder-add-module").click();
  await page.getByTestId("module-0-title").fill("[E2E] Module 1");
  await page.getByTestId("module-0-add-lesson").click();
  await page.getByTestId("module-0-lesson-0-title").fill("[E2E] Lesson 1");
  await page.getByTestId("module-0-lesson-0-type").selectOption("Video");
  await page.getByTestId("module-0-lesson-0-duration").fill("12");

  await page.getByTestId("builder-tab-Review").click();
  await page.getByTestId("builder-publish").click();

  await expect(page).toHaveURL(/\/admin\/training$/, { timeout: 20_000 });
  const row = page.locator("tr", { hasText: COURSE }).first();
  await expect(row).toBeVisible();
  await expect(row.getByText(/published/i)).toBeVisible();
});

test("the published course appears on the public catalog", async ({ page }) => {
  await page.goto("/training");
  await page.getByPlaceholder(/Search a certification, skill/i).fill(COURSE);
  const card = page.getByRole("link", { name: new RegExp("View course", "i") }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(page.getByRole("heading", { name: COURSE })).toBeVisible();
  publicSlug = new URL(page.url()).pathname;
});

test("a signed-in Yatri enrolls free and the confirmation email is composed", async ({ page }) => {
  let emailPayload: { to?: string; subject?: string; html?: string } | undefined;
  await page.route("**/api/send-email", async (route) => {
    emailPayload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });

  await page.goto(publicSlug!);
  await expect(page.getByRole("heading", { name: COURSE })).toBeVisible();
  await page.getByRole("button", { name: /Enroll for Free/i }).click();

  // Two legit paths: a complete profile auto-enrolls; otherwise the form
  // shows inside the dialog (scope fills there — the footer newsletter input
  // also matches an "email" label).
  const dialog = page.getByRole("dialog");
  const form = dialog.getByLabel(/Full Name/i);
  const confirmed = page.getByRole("button", { name: /Go to Training/i });
  await Promise.race([
    form.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
    confirmed.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {}),
  ]);
  if (await form.isVisible().catch(() => false)) {
    await form.fill("E2E Enroll Yatri");
    await dialog.getByLabel(/Email Address/i).fill(process.env.E2E_ADMIN_EMAIL || "e2e@example.com");
    await dialog.getByLabel(/Phone Number/i).fill("+91 9999999999");
    await dialog.getByLabel(/^City/i).fill("Bengaluru");
    await dialog.getByLabel(/^State/i).fill("Karnataka");
    await dialog.getByLabel(/^Country/i).fill("India");
    await dialog.getByRole("button", { name: /Confirm Enrollment/i }).click();
  }

  await expect(page.getByRole("button", { name: /Go to Training/i })).toBeVisible({ timeout: 20_000 });
  expect(emailPayload?.subject).toBe(`Enrollment Confirmed: ${COURSE}`);
  expect(emailPayload?.html).toBeTruthy();
});

test("the detail page remembers the enrollment after a reload", async ({ page }) => {
  await page.goto(publicSlug!);
  await expect(page.getByRole("button", { name: /Go to Training/i })).toBeVisible({ timeout: 15_000 });
});

test("the student dashboard opens and a lesson can be completed", async ({ page }) => {
  await page.goto(publicSlug!);
  await page.getByRole("button", { name: /Go to Training/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByText(new RegExp(`Welcome to .*E2E`, "i")).first()).toBeVisible();

  await page.getByRole("button", { name: /^Modules$/i }).click();
  const markBtn = page.getByRole("button", { name: /Mark complete/i }).first();
  await expect(markBtn).toBeVisible({ timeout: 10_000 });
  await markBtn.click();
  await expect(page.getByRole("button", { name: /^Completed$/i }).first()).toBeVisible();
});

test("the course shows in My Trainings", async ({ page }) => {
  await page.goto("/my-trainings");
  await expect(page.getByRole("heading", { name: /My Learning Journey/i })).toBeVisible();
  await expect(page.getByText(COURSE).first()).toBeVisible({ timeout: 10_000 });
});

test("the enrollment reaches the admin console", async ({ page }) => {
  await page.goto("/admin/enrollments");
  await expect(page.getByRole("heading", { name: /Student Enrollments/i })).toBeVisible();
  await page.getByPlaceholder(/Search students or courses/i).fill(COURSE);
  const row = page.locator("tbody tr", { hasText: COURSE }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await expect(row.getByText(/Free/i)).toBeVisible();
});

test("the course is deleted from the manager", async ({ page }) => {
  await page.goto("/admin/training");
  await page.getByTestId("training-search").waitFor({ state: "visible", timeout: 15_000 });
  await page.getByTestId("training-search").fill(COURSE);
  const row = page.locator("tr", { hasText: COURSE }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByTestId("training-row-menu").click();
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("training-menu-delete").click();
  await expect(page.locator("tr", { hasText: COURSE })).toHaveCount(0);
});
