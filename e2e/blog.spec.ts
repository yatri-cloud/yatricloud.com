import { test, expect } from "@playwright/test";

/**
 * Blog end-to-end smoke tests (public, unauthenticated flows).
 * Covers the reader journey + auth-gating. Authoring/social actions require a
 * signed-in session and are best added with a storageState fixture.
 */

test.describe("Yatri Blog — reader", () => {
  test("feed renders with heading, search, and write CTA", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: /Stories & ideas/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search stories/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Write a story/i })).toBeVisible();
  });

  test("a published post opens and renders its title + responses", async ({ page }) => {
    await page.goto("/blog/welcome-to-the-yatri-blog");
    await expect(page.getByRole("heading", { name: /Welcome to the Yatri Blog/i }).first()).toBeVisible();
    await expect(page.getByText(/\d+\s*min/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Responses/i })).toBeVisible();
  });

  test("post links through to the author profile", async ({ page }) => {
    await page.goto("/blog/welcome-to-the-yatri-blog");
    await page.getByRole("link", { name: /Yatri Cloud Admin/i }).first().click();
    await expect(page).toHaveURL(/\/blog\/author\//);
    await expect(page.getByRole("heading", { name: /Yatri Cloud Admin/i })).toBeVisible();
  });

  test("search filters the feed", async ({ page }) => {
    await page.goto("/blog");
    await page.getByPlaceholder(/Search stories/i).fill("welcome");
    await expect(page.getByRole("heading", { name: /Welcome to the Yatri Blog/i })).toBeVisible();
    await page.getByPlaceholder(/Search stories/i).fill("zzz-no-such-story-xyz");
    await expect(page.getByText(/No stories match/i)).toBeVisible();
  });
});

test.describe("Yatri Blog — auth gating", () => {
  test("writing prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/blog/write");
    await expect(page.getByText(/Sign in to start writing/i)).toBeVisible();
  });

  test("dashboard prompts sign-in when logged out", async ({ page }) => {
    await page.goto("/blog/dashboard");
    await expect(page.getByText(/Sign in to see your stories/i)).toBeVisible();
  });
});
