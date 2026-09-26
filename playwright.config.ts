import { defineConfig } from "@playwright/test";

// End-to-end tests run against the production build (vite preview)
export default defineConfig({
    testDir: "tests",
    timeout: 15_000,
    use: { baseURL: "http://localhost:4175", viewport: { width: 1440, height: 900 } },
    webServer: {
        command: "npm run build && npx vite preview --port 4175 --strictPort",
        url: "http://localhost:4175",
        reuseExistingServer: !process.env.CI,
    },
});
