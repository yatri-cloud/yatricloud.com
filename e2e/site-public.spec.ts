import { test, expect } from "@playwright/test";

/**
 * Site-wide public smokes (unauthenticated) — every surface outside
 * events/training/mentorship/blog (those have their own suites). Each test
 * asserts the page renders its real content (heading + a key control) and
 * that auth gating shows the right prompt, so a broken route, a crashed
 * lazy chunk, or a missing gate fails loudly.
 */

test.describe("Store & checkout", () => {
  test("store renders with search, sort, and the cart sheet opens", async ({ page }) => {
    await page.goto("/yatristore");
    await expect(
      page.getByRole("heading", { name: /Exam vouchers that put/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search vouchers/i)).toBeVisible();

    await page.getByRole("button", { name: /^Cart/i }).first().click();
    await expect(page.getByText(/Your cart/i).first()).toBeVisible();
  });

  test("a product can be added to the cart", async ({ page }) => {
    await page.goto("/yatristore");
    const addBtn = page.getByRole("button", { name: /Add to Cart/i }).first();
    await addBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    if ((await addBtn.count()) === 0) test.skip(true, "no products in the store");
    await addBtn.click();
    await page.getByRole("button", { name: /^Cart/i }).first().click();
    await expect(page.getByText(/Your cart is empty/i)).toHaveCount(0);
  });
});

test.describe("Exam dumps", () => {
  test("listing renders with search", async ({ page }) => {
    await page.goto("/examdumps");
    await expect(page.getByRole("heading", { name: /Pass on your/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search dumps/i)).toBeVisible();
  });
});

test.describe("Udemy", () => {
  test("course submission is admin-gated", async ({ page }) => {
    await page.goto("/udemy");
    await expect(page.getByRole("heading", { name: /Udemy Admin/i })).toBeVisible();
    await expect(page.getByPlaceholder("email@example.com")).toBeVisible();
  });
});

test.describe("Reviews & feedback", () => {
  test("review wall renders with search and feedback CTA", async ({ page }) => {
    await page.goto("/reviews");
    await expect(
      page.getByRole("heading", { name: /What People Say About Yatri/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Search reviews/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Leave your feedback/i })).toBeVisible();
  });

  test("feedback form renders its fields", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.getByRole("heading", { name: /Add Your Review/i })).toBeVisible();
    await expect(page.getByPlaceholder("Your Name")).toBeVisible();
    await expect(page.getByRole("button", { name: /Submit Feedback/i })).toBeVisible();
  });
});

test.describe("Wall of Fame & submissions", () => {
  test("achievements wall renders with search", async ({ page }) => {
    await page.goto("/achievements");
    await expect(page.getByRole("heading", { name: /Wall of Fame/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder(/Search Yatris/i)).toBeVisible();
  });

  test("certification submission requires sign-in", async ({ page }) => {
    await page.goto("/certifiedyatris");
    await expect(page.getByText(/Welcome Back!/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Forgot password\?/i })).toBeVisible();
  });
});

test.describe("Auth pages", () => {
  test("reset-password page renders", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /Set a new password/i })).toBeVisible();
  });
});

test.describe("Jobs & resume maker", () => {
  test("job board renders with search", async ({ page }) => {
    await page.goto("/jobs");
    await expect(
      page.getByRole("heading", { name: /Your next role is/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search job titles")).toBeVisible();
  });

  test("job applications are sign-in gated", async ({ page }) => {
    await page.goto("/jobs/applications");
    await expect(page.getByText(/Sign in to build your application pipeline/i)).toBeVisible();
  });

  test("resume maker is sign-in gated", async ({ page }) => {
    await page.goto("/resume-maker");
    await expect(
      page.getByRole("heading", { name: /Sign in to build your resume/i })
    ).toBeVisible();
  });
});

test.describe("Content pages", () => {
  test("certification paths explorer renders", async ({ page }) => {
    await page.goto("/paths");
    await expect(
      page.getByRole("heading", { name: /Your certification path/i })
    ).toBeVisible();
  });

  test("community page renders", async ({ page }) => {
    await page.goto("/community");
    await expect(
      page.getByRole("heading", { name: /You're not doing this alone/i })
    ).toBeVisible();
  });

  test("partners page renders", async ({ page }) => {
    await page.goto("/partners");
    await expect(
      page.getByRole("heading", { name: /build something together/i })
    ).toBeVisible();
  });

  test("legal pages render their content", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.goto("/terms-of-service");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("unknown routes land on the 404 page with a way home", async ({ page }) => {
    await page.goto("/no-such-route-xyz");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Return to Home/i })).toBeVisible();
  });
});

test.describe("Homepage & global search", () => {
  test("homepage renders its core sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/How to Get Certified/i).first()).toBeVisible();
  });

  test("global search opens with Ctrl+K and reports no matches honestly", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder(/Search certifications, trainings/i);
    await expect(input).toBeVisible();
    await input.fill("zzz-no-such-thing-xyz");
    await expect(page.getByText(/Nothing found/i)).toBeVisible();
  });
});

test.describe("Personal pages (signed out)", () => {
  test("my receipts shows empty state, store CTA goes to a real route", async ({ page }) => {
    await page.goto("/profile/purchases");
    await expect(page.getByRole("heading", { name: /My Receipts/i })).toBeVisible();
    await expect(page.getByText(/No receipts yet/i)).toBeVisible();
    await page.getByRole("button", { name: /Visit the store/i }).click();
    await expect(page).toHaveURL(/\/yatristore/);
    await expect(page.getByRole("heading", { name: /Exam vouchers/i })).toBeVisible();
  });

  test("my certificates renders", async ({ page }) => {
    await page.goto("/certificates");
    await expect(page.getByRole("heading", { name: /My Certificates/i })).toBeVisible();
  });

  test("edit-profile redirects signed-out visitors to sign-in", async ({ page }) => {
    await page.goto("/edit-profile");
    await expect(page).toHaveURL(/\/certifiedyatris/);
    await expect(page.getByText(/Welcome Back!/i)).toBeVisible();
  });
});
