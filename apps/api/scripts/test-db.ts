import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const apiRoot = existsSync(resolve(process.cwd(), '.env.test.example'))
  ? process.cwd()
  : resolve(process.cwd(), 'apps/api');
const testEnv = dotenv.config({ path: resolve(apiRoot, '.env.test'), override: true });
if (testEnv.error || !testEnv.parsed || !testEnv.parsed.DATABASE_URL)
  dotenv.config({ path: resolve(apiRoot, '.env.test.example'), override: true });

const databaseUrl = process.env.DATABASE_URL ?? '';
const databaseName = databaseUrl.match(/(?:^|;)database=([^;]+)/i)?.[1] ?? '';

if (!databaseName.toLowerCase().endsWith('_test')) {
  throw new Error(
    'Refusing test database operation: DATABASE_URL must target a database ending in _test.',
  );
}

const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl };
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const testCoinPackages = [
  { code: 'ZENX_1000', name: 'ZENX 1,000', priceVnd: 20_000n, coinAmount: 1_000n, sortOrder: 1 },
  { code: 'ZENX_2500', name: 'ZENX 2,500', priceVnd: 50_000n, coinAmount: 2_500n, sortOrder: 2 },
  { code: 'ZENX_5000', name: 'ZENX 5,000', priceVnd: 100_000n, coinAmount: 5_000n, sortOrder: 3 },
  { code: 'ZENX_12500', name: 'ZENX 12,500', priceVnd: 200_000n, coinAmount: 12_500n, sortOrder: 4 },
  { code: 'ZENX_25000', name: 'ZENX 25,000', priceVnd: 500_000n, coinAmount: 25_000n, sortOrder: 5 },
  { code: 'ZENX_50000', name: 'ZENX 50,000', priceVnd: 1_000_000n, coinAmount: 50_000n, sortOrder: 6 },
  { code: 'ZENX_100000', name: 'ZENX 100,000', priceVnd: 2_000_000n, coinAmount: 100_000n, sortOrder: 7 },
] as const;

async function prepare() {
  execFileSync('prisma', ['migrate', 'deploy'], { stdio: 'inherit', env });
  execFileSync('tsx', ['prisma/seed.ts'], { stdio: 'inherit', env });
}

async function reset() {
  await prisma.$connect();
  // Delete children before parents. Finance fixtures are reset explicitly so
  // E2E-created packages cannot change the assumptions of integration tests.
  for (const table of [
    'support_ticket_read_states',
    'support_ticket_messages',
    'support_tickets',
    'wallet_transactions',
    'payments',
    'otp_verifications',
    'otp_requests',
    'refresh_sessions',
    'wallets',
    'social_identities',
    'sensitive_profiles',
    'user_profiles',
    'user_roles',
    'users',
  ]) {
    await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[${table}]`);
  }
  await prisma.coinPackage.deleteMany();
  await prisma.coinPackage.createMany({ data: testCoinPackages });
}

async function main() {
  const command = process.argv[2];
  try {
    if (command === 'prepare') await prepare();
    else if (command === 'reset') await reset();
    else throw new Error(`Unknown test-db command: ${command ?? '(missing)'}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
