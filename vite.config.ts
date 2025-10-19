/// <reference types="vitest" />

import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "fs"; // Import Node.js File System module

const isProduction = process.env.NODE_ENV === "production";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy(),
    // Removed basicSsl() as we're using mkcert generated certs
  ],
  server: {
    host: "0.0.0.0", // Ensures it's accessible over network IP
    ...(isProduction
      ? {}
      : {
          https: {
            key: fs.readFileSync("./localhost+1-key.pem"),
            cert: fs.readFileSync("./localhost+1.pem"),
          },
        }),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
