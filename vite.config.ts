/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs"; // Import Node.js File System module

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    // Removed basicSsl() as we're using mkcert generated certs
  ],
  server: {
    host: "0.0.0.0", // Ensures it's accessible over network IP
    https: {
      key: fs.readFileSync("./localhost+1-key.pem"),
      cert: fs.readFileSync("./localhost+1.pem"),
    },
    hmr: {
      // Disable HMR overlay to prevent potential SSL handshake issues
      overlay: false,
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
