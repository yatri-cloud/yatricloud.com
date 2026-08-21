import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    watch: {
      // Use polling for better file watching on external drives/network volumes
      usePolling: true,
      // Polling interval in milliseconds
      interval: 1000,
      // Ignore node_modules and other large directories
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    hmr: {
      overlay: true,
    },
    // Set headers to allow Google Login popups
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    // Proxy API routes to the local dev server (server.js on :3001) so the
    // frontend can always use relative `/api/*` paths. In production these
    // routes are served by Vercel serverless functions under `api/`.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optimize for development
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Clear cache on build
  clearScreen: false,
  build: {
    rollupOptions: {
      output: {
        // Long-lived shared vendors get their own chunks so route updates don't
        // invalidate them in users' caches, and so the entry chunk stays lean.
        // Route-specific heavies (html2canvas, maps, country data, the admin
        // console, TrainingManager, payments) fall into their own chunks
        // automatically via the lazy routes in App.tsx.
        // Only hoist the broadly-shared vendors into their own long-lived chunks.
        // Everything else is left to Rollup's default splitting, so a library used
        // only by a lazy route stays IN that route's chunk instead of being pulled
        // into an eagerly-loaded catch-all "vendor" bundle.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // Keep all of React in ONE chunk so there's a single copy of the
          // shared singleton, initialised before anything that depends on it.
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return "react-vendor";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          return undefined;
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
