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
    // Enable HMR
    hmr: {
      overlay: true,
    },
    // Proxy API routes for local development
    // In production, these routes are handled by Vercel serverless functions
    // In local dev, we proxy directly to Google Apps Script to avoid CORS
    proxy: {
      '/api/yatris-proxy': {
        target: process.env.VITE_YATRIS_USERS_API_URL || 'https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => '', // Remove /api/yatris-proxy, proxy to root of target
      },
      '/api/reviews': {
        target: process.env.VITE_CERTIFICATE_REVIEWS_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw-LbPpzjLhGAXmgHqzcafhsEaYurhcxwBp5kWmCPA_iqwC_uj4dARB52TKItDaerPmvg/exec',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/reviews/, ''),
      },
      // Proxy for local backend server
      '/api': {
        target: 'http://localhost:3001',
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
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
