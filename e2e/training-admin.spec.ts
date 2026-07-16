import { test, expect, type Page } from "@playwright/test";

/**
 * Training admin — authenticated E2E (runs under the `admin` project, which
 * reuses the session from auth.setup.ts).
 *
 * Exercises the shadcn/Radix controls that resist ad-hoc automation but work
 * fine under Playwright's real, trusted input events: the 7-tab course builder
 * (Radix Selects + Tabs), the react-hook-form curriculum field arrays, and the
 * row ⋮ DropdownMenu.
 *
 * Each run creates a clearly-labelled course and deletes it again so the suite
 * is self-cleaning and re-runnable against a real database.
 */

// Unique per run so parallel/repeat runs never collide.
const RUN = `${Date.now().toString(36)}`;
const COURSE = `[E2E] Playwright Course ${RUN}`;

/** Open the builder's ⋮ menu for the row containing `name` and delete it. */
async function deleteCourseFromList(page: Page, name: string) {
  await page.goto("/admin/training");
  // Wait for the list to actually load its rows before deciding — row.count()
  // does not auto-wait, so an early check would miss a row still being fetched.
  await page.getByTestId("training-search").waitFor({ state: "visible", timeout: 15_000 });
  await page.locator("tbody tr").first().waitFor({ timeout: 15_000 }).catch(() => {});
  const row = page.locator("tr", { hasText: name }).first();
  if ((await row.count()) === 0) return; // already gone
  await row.getByTestId("training-row-menu").click();
  // handleDelete gates on a native window.confirm — accept it so the delete
  // actually fires (Playwright dismisses dialogs by default).
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("training-menu-delete").click();
  await expect(page.locator("tr", { hasText: name })).toHaveCount(0);
}

test.afterAll(async ({ browser }) => {
  // Safety-net cleanup in case a test failed before its own delete step.
  const page = await browser.newPage({ storageState: "e2e/.auth/admin.json" });
  await deleteCourseFromList(page, COURSE).catch(() => {});
  await page.close();
});

test("course builder: create → curriculum → save draft → appears in manager", async ({
  page,
}) => {
  await page.goto("/admin/training/create");

  // --- Identity tab (default) ---
  // Pick the Training Type FIRST — the Course/Exam Name field only renders once
  // a type is selected (Radix Select: click the trigger, then the option).
  await page.getByTestId("builder-type-trigger").click();
  await page.getByRole("option", { name: "Certification" }).click();

  await page.getByTestId("builder-course-name").fill(COURSE);
  await page
    .getByTestId("builder-description")
    .fill("[E2E] Created by Playwright. Safe to delete.");

  // --- Details tab ---
  await page.getByTestId("builder-tab-Details").click();
  await page.getByTestId("builder-duration").fill("6 hours");
  await page.getByTestId("builder-level-trigger").click();
  await page.getByRole("option", { name: "Beginner" }).click();
  await page.getByTestId("builder-skills").fill("Playwright, E2E testing");

  // --- Curriculum tab (react-hook-form field arrays) ---
  await page.getByTestId("builder-tab-Curriculum").click();
  await page.getByTestId("builder-add-module").click();
  await page.getByTestId("module-0-title").fill("[E2E] Module 1");
  await page.getByTestId("module-0-add-lesson").click();
  await page.getByTestId("module-0-lesson-0-title").fill("[E2E] Lesson 1");
  await page.getByTestId("module-0-lesson-0-type").selectOption("Video");
  await page.getByTestId("module-0-lesson-0-duration").fill("12");

  // --- Save draft ---
  await page.getByTestId("builder-save-draft").click();

  // Lands back on the manager list with the new course present.
  await expect(page).toHaveURL(/\/admin\/training$/);
  const row = page.locator("tr", { hasText: COURSE }).first();
  await expect(row).toBeVisible();
  await expect(row.getByText(/draft/i)).toBeVisible();

  // Cleanup (also exercises the row ⋮ DropdownMenu + delete).
  await deleteCourseFromList(page, COURSE);
});

test("manager: search and status filter narrow the list", async ({ page }) => {
  await page.goto("/admin/training");

  // Data-dependent: needs at least one real course (e.g. AZ-900). Skip
  // cleanly when the trainings table is empty instead of failing.
  const anyRow = page.locator("tbody tr").first();
  await anyRow.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  test.skip((await page.locator("tbody tr").count()) === 0, "no courses in the trainings table");

  // Search narrows to matching rows only; a nonsense query empties the list.
  await page.getByTestId("training-search").fill("zzz-no-such-course-xyz");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByTestId("training-search").fill("");
  await expect(anyRow).toBeVisible();

  // The Published filter keeps only published courses (skip silently if none).
  await page.getByTestId("training-filter-published").click();
  const rows = page.locator("tbody tr");
  if ((await rows.count()) > 0) {
    await expect(rows.first().getByText(/published/i)).toBeVisible();
  }
});
