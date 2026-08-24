import { createHash } from 'node:crypto';
import { MockPaymentProvider } from './payment.provider';

describe('MockPaymentProvider', () => {
  it('rejects callbacks with an invalid signature', async () => {
    const provider = new MockPaymentProvider();
    await expect(provider.verifyCallback({ rawBody: '{}', signature: 'bad', payload: {} })).rejects.toThrow('Invalid mock signature');
  });

  it('verifies deterministic callback signatures', async () => {
    const provider = new MockPaymentProvider();
    const rawBody = JSON.stringify({ providerTransactionId: 'mock-tx', paymentNo: 'ZPAY-1', status: 'SUCCESS' });
    const signature = createHash('sha256').update(rawBody).digest('hex');
    await expect(provider.verifyCallback({ rawBody, signature, payload: { providerTransactionId: 'mock-tx', paymentNo: 'ZPAY-1', status: 'SUCCESS' } })).resolves.toEqual({ providerTransactionId: 'mock-tx', paymentNo: 'ZPAY-1', status: 'SUCCESS' });
  });
});
