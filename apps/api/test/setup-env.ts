import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

const apiRoot = existsSync(resolve(process.cwd(), '.env.test.example')) ? process.cwd() : resolve(process.cwd(), 'apps/api');
const testEnv = dotenv.config({ path: resolve(apiRoot, '.env.test'), override: true });
const loadedTestEnv = testEnv.error || !testEnv.parsed || !testEnv.parsed.DATABASE_URL
  ? dotenv.config({ path: resolve(apiRoot, '.env.test.example'), override: true })
  : testEnv;
for (const key of [
  'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'GOOGLE_AUTHORIZATION_URL', 'GOOGLE_TOKEN_URL', 'GOOGLE_USERINFO_URL',
  'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_REDIRECT_URI', 'FACEBOOK_AUTHORIZATION_URL', 'FACEBOOK_TOKEN_URL', 'FACEBOOK_USERINFO_URL',
]) {
  if (!loadedTestEnv.parsed || !(key in loadedTestEnv.parsed)) delete process.env[key];
}
process.env.NODE_ENV = 'test';
