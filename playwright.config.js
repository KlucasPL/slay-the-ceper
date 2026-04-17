import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 240_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'http://localhost:4173',
    // Guardrail: never allow requests outside localhost
    extraHTTPHeaders: {},
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Game preview build
      command: 'npx vite preview --port 4173',
      url: 'http://localhost:4173/slay-the-ceper/',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Static server for dashboard
      command: `npx serve ${join(__dirname, 'tools/dashboard')} --listen tcp://127.0.0.1:5174 --no-clipboard`,
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 15_000,
    },
  ],
});
