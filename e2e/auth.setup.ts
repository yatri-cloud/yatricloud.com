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
      // Sign in through the app's OWN admin login (not raw supabase) so it sets
      // the localStorage `yatri:user` mirror + role that the admin gate reads —
      // raw signInWithPassword persists the Supabase session but leaves the
      // app's mirror empty, so the gate still shows the login form.
      const admin = await import("/src/lib/admin-api.ts");
      const res = await admin.loginAdmin(email!, password!);
      // The admin shell is gated by a localStorage `admin_token` that the
      // AdminDashboard's onLogin handler normally writes — replicate that so the
      // gate unlocks (the real auth is the Supabase session loginAdmin created).
      if (res?.token) localStorage.setItem("admin_token", res.token);
      const sb = await import("/src/lib/supabase.ts");
      const { data } = await sb.supabase.auth.getUser();
      return {
        ok: !res?.error,
        error: res?.error ?? null,
        signedInAs: data?.user?.email ?? null,
      };
    },
    { email, password },
  );

  expect(result.error, `Supabase sign-in failed: ${result.error}`).toBeNull();
  expect(result.ok, "No session returned from signInWithPassword").toBeTruthy();
  console.log(`[auth.setup] signed in as: ${result.signedInAs}`);

  // Sanity-check that an admin surface actually renders before saving state.
  await page.goto("/admin/training");
  await expect(page.getByTestId("training-create-new")).toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
