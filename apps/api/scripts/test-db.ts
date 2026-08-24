import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: resolve(process.cwd(), '.env.test') });
dotenv.config({ path: resolve(process.cwd(), '.env.test.example') });

const databaseUrl = process.env.DATABASE_URL ?? '';
const databaseName = databaseUrl.match(/(?:^|;)database=([^;]+)/i)?.[1] ?? '';

if (!databaseName.toLowerCase().endsWith('_test')) {
  throw new Error('Refusing test database operation: DATABASE_URL must target a database ending in _test.');
}

const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: databaseUrl };
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function prepare() {
  execFileSync('prisma', ['migrate', 'deploy'], { stdio: 'inherit', env });
  execFileSync('tsx', ['prisma/seed.ts'], { stdio: 'inherit', env });
}

async function reset() {
  await prisma.$connect();
  // Delete children before parents; coin_packages intentionally remains as a fixture table.
  for (const table of [
    'wallet_transactions',
    'payments',
    'otp_verifications',
    'otp_requests',
    'refresh_sessions',
    'wallets',
    'social_identities',
    'user_profiles',
    'users',
  ]) {
    await prisma.$executeRawUnsafe(`DELETE FROM [dbo].[${table}]`);
  }
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
