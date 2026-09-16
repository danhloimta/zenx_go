import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const cutoff = new Date(Date.now() - 180 * 86_400_000);
    const { count } = await prisma.userActivityLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
    console.log(`Deleted ${count} user activity logs older than 180 days.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
