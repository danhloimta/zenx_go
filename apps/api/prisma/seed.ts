import { PrismaClient } from '@prisma/client';
import { CoinPackageStatus } from '../src/common/domain';

const prisma = new PrismaClient();

async function main() {
  const packages = [
    ['ZENX_20', 'ZENX 20', 20000n, 200n, 1],
    ['ZENX_50', 'ZENX 50', 50000n, 500n, 2],
    ['ZENX_100', 'ZENX 100', 100000n, 1000n, 3],
    ['ZENX_200', 'ZENX 200', 200000n, 2000n, 4],
    ['ZENX_500', 'ZENX 500', 500000n, 5000n, 5],
  ] as const;

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
