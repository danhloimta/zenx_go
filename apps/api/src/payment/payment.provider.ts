import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PaymentMethod } from '../common/domain';

export type ProviderPayment = {
  providerTransactionId: string;
  paymentUrl: string;
  qrPayload?: string;
  displayMetadata?: Record<string, unknown>;
  status: 'PENDING';
};
export type VerifiedPaymentCallback = { providerTransactionId: string; paymentNo: string; status: 'SUCCESS' | 'FAILED' | 'EXPIRED' };

export interface PaymentProvider {
  createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: PaymentMethod }): Promise<ProviderPayment>;
  verifyCallback(input: { rawBody: string; signature: string; payload: Record<string, unknown> }): Promise<VerifiedPaymentCallback>;
  queryPayment(input: { providerTransactionId: string }): Promise<ProviderPayment['status']>;
  getDisplayMetadata(paymentMethod: PaymentMethod): Record<string, unknown>;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: PaymentMethod }) {
    const metadata = this.getDisplayMetadata(input.paymentMethod);
    return {
      providerTransactionId: `mock-${input.paymentNo}`,
      paymentUrl: `/payment/mock/${input.paymentNo}`,
      qrPayload: input.paymentMethod === PaymentMethod.VIETQR || input.paymentMethod === PaymentMethod.BANK_TRANSFER
        ? JSON.stringify({ paymentNo: input.paymentNo, amountVnd: input.amountVnd.toString(), coinAmount: input.coinAmount.toString(), method: input.paymentMethod })
        : undefined,
      displayMetadata: metadata,
      status: 'PENDING' as const,
    };
  }

  async verifyCallback(input: { rawBody: string; signature: string; payload: Record<string, unknown> }) {
    const expected = createHash('sha256').update(input.rawBody).digest('hex');
    if (input.signature !== expected) throw new Error('Invalid mock signature');
    const status = String(input.payload.status).toUpperCase();
    if (status !== 'SUCCESS' && status !== 'FAILED' && status !== 'EXPIRED') throw new Error('Invalid callback status');
    return { providerTransactionId: String(input.payload.providerTransactionId), paymentNo: String(input.payload.paymentNo), status: status as 'SUCCESS' | 'FAILED' | 'EXPIRED' };
  }

  async queryPayment(_input: { providerTransactionId: string }) { return 'PENDING' as const; }

  getDisplayMetadata(paymentMethod: PaymentMethod) {
    const labels: Record<PaymentMethod, string> = {
      MOMO: 'MoMo',
      ZALOPAY: 'ZaloPay',
      BANK_TRANSFER: 'Chuyển khoản ngân hàng',
      CARD: 'Thẻ Visa/Mastercard',
      VIETQR: 'VietQR',
    };
    return { method: paymentMethod, label: labels[paymentMethod], flow: paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.VIETQR ? 'QR' : 'REDIRECT', provider: 'mock' };
  }
}
