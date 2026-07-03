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
        // Long-lived shared vendors get their own chunks so route updates
        // don't invalidate them in users' caches. Route-specific heavies
        // (html2canvas, maps, country data) fall into their route chunks
        // automatically via the lazy routes in App.tsx.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase": ["@supabase/supabase-js"],
          "motion": ["framer-motion"],
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
