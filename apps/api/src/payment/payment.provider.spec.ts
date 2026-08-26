import { createHash, createHmac } from 'node:crypto';
import { PaymentMethod } from '../common/domain';
import { InvalidSepayWebhookError, MockPaymentProvider, SepayPaymentProvider } from './payment.provider';

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

describe('SepayPaymentProvider', () => {
  const secret = 'sepay-webhook-secret-32-characters';
  const config = {
    get: (key: string) => ({
      'sepay.bankAccount': '0123456789',
      'sepay.bankCode': 'Vietcombank',
      'sepay.accountHolder': 'ZENX GO',
      'sepay.webhookSecret': secret,
      'sepay.transferPrefix': 'ZENX',
      'sepay.qrBaseUrl': 'https://vietqr.app/img',
    } as Record<string, string>)[key],
  };

  it('builds a VietQR URL with the payment amount and transfer code', async () => {
    const provider = new SepayPaymentProvider(config as never);
    const payment = await provider.createPayment({ paymentNo: 'ZENXABC123', amountVnd: 50_000n, coinAmount: 500n, paymentMethod: PaymentMethod.VIETQR });
    const qr = new URL(payment.qrImageUrl!);
    expect(payment.providerTransactionId).toBeNull();
    expect(qr.searchParams.get('acc')).toBe('0123456789');
    expect(qr.searchParams.get('bank')).toBe('Vietcombank');
    expect(qr.searchParams.get('amount')).toBe('50000');
    expect(qr.searchParams.get('des')).toBe('ZENXABC123');
    expect(qr.searchParams.get('template')).toBe('compact');
  });

  it('verifies the raw body signature and rejects stale or tampered requests', () => {
    const provider = new SepayPaymentProvider(config as never);
    const body = JSON.stringify({ id: 1, code: 'ZENXABC123' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
    expect(() => provider.verifyWebhook({ rawBody: body, timestamp, signature })).not.toThrow();
    expect(() => provider.verifyWebhook({ rawBody: `${body} `, timestamp, signature })).toThrow(InvalidSepayWebhookError);
    expect(() => provider.verifyWebhook({ rawBody: body, timestamp: String(Number(timestamp) - 301), signature })).toThrow(InvalidSepayWebhookError);
  });
});
