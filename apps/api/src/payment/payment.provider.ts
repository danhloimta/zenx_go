import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

export type ProviderPayment = { providerTransactionId: string; paymentUrl: string; status: 'PENDING' };
export type VerifiedPaymentCallback = { providerTransactionId: string; paymentNo: string; status: 'SUCCESS' | 'FAILED' | 'EXPIRED' };

export interface PaymentProvider {
  createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: string }): Promise<ProviderPayment>;
  verifyCallback(input: { rawBody: string; signature: string; payload: Record<string, unknown> }): Promise<VerifiedPaymentCallback>;
  queryPayment(input: { providerTransactionId: string }): Promise<ProviderPayment['status']>;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: string }) {
    return { providerTransactionId: `mock-${input.paymentNo}`, paymentUrl: `http://localhost:3000/payment/mock/${input.paymentNo}`, status: 'PENDING' as const };
  }

  async verifyCallback(input: { rawBody: string; signature: string; payload: Record<string, unknown> }) {
    const expected = createHash('sha256').update(input.rawBody).digest('hex');
    if (input.signature !== expected) throw new Error('Invalid mock signature');
    const status = String(input.payload.status).toUpperCase();
    if (status !== 'SUCCESS' && status !== 'FAILED' && status !== 'EXPIRED') throw new Error('Invalid callback status');
    return { providerTransactionId: String(input.payload.providerTransactionId), paymentNo: String(input.payload.paymentNo), status: status as 'SUCCESS' | 'FAILED' | 'EXPIRED' };
  }

  async queryPayment(_input: { providerTransactionId: string }) { return 'PENDING' as const; }
}
