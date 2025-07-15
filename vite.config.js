import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fallback to localhost if TAURI_DEV_HOST is not set
const host = process.env.TAURI_DEV_HOST || "localhost";

export default defineConfig({
  plugins: [react()],

  // Enable source maps for better debugging
  build: {
    sourcemap: true,
  },

  // Optional: Define global constants
  define: {
    __DEV__: process.env.NODE_ENV !== "production",
  },

  // Don't clear terminal on reload (useful for Tauri debugging)
  clearScreen: false,

  server: {
    host: host,          // Ensure the dev server is accessible
    port: 1420,          // Match the port with Tauri config
    strictPort: true,    // Fail if the port is already in use

    hmr: {
      protocol: "ws",    // WebSocket for hot module reload
      host: host,        // Use resolved host (localhost or network IP)
      port: 1421         // Custom HMR port
    },

    watch: {
      ignored: ["**/src-tauri/**"], // Don't reload on backend code changes
    },
  },
});
