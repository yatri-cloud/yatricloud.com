import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests only (src/**). The Playwright e2e suite in e2e/ runs separately via
// `npm run test:e2e` — excluded here so vitest doesn't try to execute it.
export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
