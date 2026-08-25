import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

const apiRoot = existsSync(resolve(process.cwd(), '.env.test.example')) ? process.cwd() : resolve(process.cwd(), 'apps/api');
const testEnv = dotenv.config({ path: resolve(apiRoot, '.env.test'), override: true });
if (testEnv.error || !testEnv.parsed || !testEnv.parsed.DATABASE_URL) dotenv.config({ path: resolve(apiRoot, '.env.test.example'), override: true });
process.env.NODE_ENV = 'test';
