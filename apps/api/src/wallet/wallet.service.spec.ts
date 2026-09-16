import { WalletService } from './wallet.service';

describe('WalletService.getWallet', () => {
  it('includes only successful TOPUP transactions in totalTopup', async () => {
    const prisma = {
      wallet: { findUniqueOrThrow: jest.fn().mockResolvedValue({ currency: 'ZENX', balance: 2500n, updatedAt: new Date() }) },
      walletTransaction: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1200n } }) },
    };
    const service = new WalletService(prisma as never);

    await expect(service.getWallet('user-1')).resolves.toMatchObject({
      currency: 'ZENX', balance: 2500n, totalTopup: 1200n,
    });
    expect(prisma.walletTransaction.aggregate).toHaveBeenCalledWith({
      where: { userId: 'user-1', type: 'TOPUP', status: 'SUCCESS' },
      _sum: { amount: true },
    });
  });
});
