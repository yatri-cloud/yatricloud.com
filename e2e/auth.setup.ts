import { test as setup, expect } from "@playwright/test";

/**
 * One-time admin authentication for the `admin` Playwright project.
 *
 * Signs in through the app's OWN Supabase client (imported from the running
 * Vite dev server) so the session is written to localStorage in exactly the
 * shape the app reads back — no hand-crafted token format to keep in sync.
 * The resulting storage state is saved to e2e/.auth/admin.json and reused by
 * every authenticated spec.
 *
 * Requires two env vars (never commit these):
 *   E2E_ADMIN_EMAIL     — an admin account that signs in with email+password
 *   E2E_ADMIN_PASSWORD
 *
 * If your admin only signs in with Google OAuth, create a dedicated
 * email+password test-admin in Supabase (Auth → Users) and grant it admin
 * via your is_admin() rule, then use those credentials here.
 */

// Relative to the project root (Playwright's cwd) — matches the `storageState`
// path in playwright.config.ts.
const authFile = "e2e/.auth/admin.json";

setup("authenticate as admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  expect(
    email && password,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run the authenticated admin E2E project.",
  ).toBeTruthy();

  // Load the app so its Supabase client module is available to import.
  await page.goto("/");

  const result = await page.evaluate(
    async ({ email, password }) => {
      // Import the app's configured client — same URL/key/storage the app uses.
      const mod = await import("/src/lib/supabase.ts");
      const { data, error } = await mod.supabase.auth.signInWithPassword({
        email: email!,
        password: password!,
      });
      return { ok: Boolean(data?.session), error: error?.message ?? null };
    },
    { email, password },
  );

  expect(result.error, `Supabase sign-in failed: ${result.error}`).toBeNull();
  expect(result.ok, "No session returned from signInWithPassword").toBeTruthy();

  // Sanity-check that an admin surface actually renders before saving state.
  await page.goto("/admin/training");
  await expect(page.getByTestId("training-create-new")).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
