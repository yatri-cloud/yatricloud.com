import { defineConfig, devices } from "@playwright/test";
// Load the git-ignored .env so E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (used by
// auth.setup.ts) can live there like the other secrets — never exported by hand.
import "dotenv/config";

/**
 * E2E config. Tests hit the running dev server (reused if already up, else
 * started with `npm run dev`).
 *
 * Projects:
 *  - `setup`  — signs in as admin once and saves the session to
 *               e2e/.auth/admin.json (see e2e/auth.setup.ts). Needs
 *               E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars.
 *  - `public` — unauthenticated specs (e.g. blog). No storageState.
 *  - `admin`  — authenticated specs (training admin). Reuses the saved
 *               session; depends on `setup`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // In CI: `github` surfaces each failing test as a GitHub annotation (readable
  // without downloading logs) and `html` writes the report the CI job uploads.
  reporter: process.env.CI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      // Everything except the auth setup and the authenticated admin specs.
      testIgnore: [/.*\.setup\.ts/, /-admin\.spec\.ts/],
    },
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
      // All authenticated admin specs (training-admin, events-admin, mentorship-admin).
      testMatch: /-admin\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
