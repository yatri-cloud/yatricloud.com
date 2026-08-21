import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


function devCurrencyPlugin() {
  return {
    name: 'dev-currency-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/currency')) {
          const url = new URL(req.url, 'http://localhost:8080');
          const mode = (url.searchParams.get('mode') || 'rates').toLowerCase();
          res.setHeader('Content-Type', 'application/json');
          if (mode === 'detect') {
            res.end(JSON.stringify({ country: 'IN', currency: 'INR' }));
            return;
          }
          res.end(JSON.stringify({
            base: 'INR',
            rates: {
              INR: 1, USD: 0.0117, EUR: 0.0108, GBP: 0.0093, AED: 0.043, CAD: 0.016, AUD: 0.0179,
              SGD: 0.0158, JPY: 1.76, SAR: 0.044, QAR: 0.0428, NZD: 0.0195, CHF: 0.0106
            },
            source: 'dev-fallback',
            updatedAt: new Date().toISOString()
          }));
          return;
        }
        next();
      });
    },
  };
}

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
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
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
  plugins: [devCurrencyPlugin(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
