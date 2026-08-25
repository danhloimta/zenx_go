import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../api/.env.test') });
dotenv.config({ path: resolve(__dirname, '../api/.env.test.example') });

const e2eWebOrigin = 'http://localhost:3300';
const e2eApiBaseUrl = 'http://localhost:4300/api/v1';
process.env.E2E_API_BASE_URL = e2eApiBaseUrl;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: e2eWebOrigin, trace: 'on-first-retry' },
  webServer: [
    {
      command: 'pnpm --filter api start',
      cwd: '../..',
      url: `${e2eApiBaseUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'test', API_PORT: '4300', WEB_ORIGIN: e2eWebOrigin, OTP_MOCK_FIXED_CODE: '123456' },
    },
    {
      command: 'pnpm --filter web start',
      url: e2eWebOrigin,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, PORT: '3300', NEXT_DIST_DIR: '.next-e2e', NEXT_PUBLIC_API_BASE_URL: e2eApiBaseUrl },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});
