import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_RUN === "true" ? {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  } : undefined,
});
