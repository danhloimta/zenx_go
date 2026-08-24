import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../api/.env.test') });
dotenv.config({ path: resolve(__dirname, '../api/.env.test.example') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: [
    {
      command: 'pnpm --filter api start',
      cwd: '../..',
      url: 'http://localhost:4100/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'test', API_PORT: '4100', WEB_ORIGIN: 'http://localhost:3000', OTP_MOCK_FIXED_CODE: '123456' },
    },
    {
      command: 'pnpm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4100/api/v1' },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
