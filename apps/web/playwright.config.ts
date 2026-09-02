import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../api/.env.test') });
dotenv.config({ path: resolve(__dirname, '../api/.env.test.example') });

const e2eWebOrigin = 'http://lvh.me:3300';
const e2eApiOrigin = 'http://127.0.0.1:4300';
const e2eApiBaseUrl = `${e2eApiOrigin}/api/v1`;
process.env.E2E_API_BASE_URL = e2eApiBaseUrl;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: e2eWebOrigin, trace: 'on-first-retry' },
  webServer: [
    {
      command: 'node apps/web/e2e/mock-oauth-server.mjs',
      cwd: '../..',
      url: 'http://127.0.0.1:4400/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, OAUTH_MOCK_PORT: '4400' },
    },
    {
      command: 'pnpm --filter api start',
      cwd: '../..',
      url: `${e2eApiBaseUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        API_PORT: '4300',
        WEB_ORIGIN: e2eWebOrigin,
        PUBLIC_BASE_DOMAIN: 'lvh.me',
        PUBLIC_WEB_ORIGIN: e2eWebOrigin,
        COOKIE_DOMAIN: '.lvh.me',
        COOKIE_SECURE: 'false',
        ALLOWED_WEB_ORIGINS: `${e2eWebOrigin},http://lucdia.lvh.me:3300,http://hoalong.lvh.me:3300,http://thitranmay.lvh.me:3300,http://orion.lvh.me:3300`,
        ALLOW_GAME_SUBDOMAINS: 'true',
        RATE_LIMIT_TTL_MS: '60000',
        RATE_LIMIT_MAX: '1000',
        ALLOW_TEST_OAUTH: 'true',
        OTP_MOCK_FIXED_CODE: '123456',
        GOOGLE_CLIENT_ID: 'e2e-google-client',
        GOOGLE_CLIENT_SECRET: 'e2e-google-secret',
        GOOGLE_REDIRECT_URI: `${e2eWebOrigin}/api/v1/auth/google/callback`,
        GOOGLE_AUTHORIZATION_URL: 'http://127.0.0.1:4400/google/authorize',
        GOOGLE_TOKEN_URL: 'http://127.0.0.1:4400/google/token',
        GOOGLE_USERINFO_URL: 'http://127.0.0.1:4400/google/userinfo',
        FACEBOOK_CLIENT_ID: 'e2e-facebook-client',
        FACEBOOK_CLIENT_SECRET: 'e2e-facebook-secret',
        FACEBOOK_REDIRECT_URI: `${e2eWebOrigin}/api/v1/auth/facebook/callback`,
        FACEBOOK_AUTHORIZATION_URL: 'http://127.0.0.1:4400/facebook/authorize',
        FACEBOOK_TOKEN_URL: 'http://127.0.0.1:4400/facebook/token',
        FACEBOOK_USERINFO_URL: 'http://127.0.0.1:4400/facebook/userinfo',
      },
    },
    {
      command: 'pnpm --filter web start',
      url: 'http://127.0.0.1:3300/api/v1/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { ...process.env, PORT: '3300', NEXT_DIST_DIR: '.next-e2e', NEXT_PUBLIC_API_BASE_URL: '/api/v1', API_PROXY_ORIGIN: e2eApiOrigin, PUBLIC_BASE_DOMAIN: 'lvh.me', PUBLIC_WEB_ORIGIN: e2eWebOrigin },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--host-resolver-rules=MAP lvh.me 127.0.0.1,MAP *.lvh.me 127.0.0.1'] } } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'], launchOptions: { args: ['--host-resolver-rules=MAP lvh.me 127.0.0.1,MAP *.lvh.me 127.0.0.1'] } } },
  ],
});
