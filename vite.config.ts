import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  },
  // Optimize for development
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Clear cache on build
  clearScreen: false,
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
