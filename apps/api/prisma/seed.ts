import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { CoinPackageStatus } from '../src/common/domain';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    ['ZENX_1000', 'ZENX 1,000', 20000n, 1000n, 1],
    ['ZENX_2500', 'ZENX 2,500', 50000n, 2500n, 2],
    ['ZENX_5000', 'ZENX 5,000', 100000n, 5000n, 3],
    ['ZENX_12500', 'ZENX 12,500', 200000n, 12500n, 4],
    ['ZENX_25000', 'ZENX 25,000', 500000n, 25000n, 5],
    ['ZENX_50000', 'ZENX 50,000', 1000000n, 50000n, 6],
    ['ZENX_100000', 'ZENX 100,000', 2000000n, 100000n, 7],
  ] as const;

  await prisma.coinPackage.updateMany({ where: { code: { notIn: packages.map(([code]) => code) } }, data: { status: CoinPackageStatus.INACTIVE } });

  for (const [code, name, priceVnd, coinAmount, sortOrder] of packages) {
    await prisma.coinPackage.upsert({
      where: { code },
      update: { name, priceVnd, coinAmount, sortOrder, status: CoinPackageStatus.ACTIVE },
      create: { code, name, priceVnd, coinAmount, sortOrder },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
