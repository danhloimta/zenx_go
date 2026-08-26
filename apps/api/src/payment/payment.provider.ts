import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentMethod } from '../common/domain';

export type ProviderPayment = {
  providerTransactionId: string | null;
  paymentUrl: string | null;
  qrImageUrl?: string | null;
  qrPayload?: string;
  displayMetadata?: Record<string, unknown>;
  status: 'PENDING';
};

export type VerifiedPaymentCallback = {
  providerTransactionId: string;
  paymentNo: string;
  status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
  paidAt?: Date;
};

export type SepayWebhookPayload = {
  id: string | number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  code?: string | null;
  content: string;
  transferType: 'in' | 'out';
  description?: string | null;
  transferAmount: number | string;
  accumulated?: number | string | null;
  referenceCode?: string | null;
};

export class InvalidSepayWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSepayWebhookError';
  }
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: PaymentMethod }): Promise<ProviderPayment>;
  verifyCallback(input: { rawBody: string; signature: string; payload: Record<string, unknown> }): Promise<VerifiedPaymentCallback>;
  queryPayment(input: { providerTransactionId: string }): Promise<ProviderPayment['status']>;
  getDisplayMetadata(paymentMethod: PaymentMethod): Record<string, unknown>;
}

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

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
    return { method: paymentMethod, label: labels[paymentMethod], flow: paymentMethod === PaymentMethod.BANK_TRANSFER || paymentMethod === PaymentMethod.VIETQR ? 'QR' : 'REDIRECT', provider: this.name };
  }
}

@Injectable()
export class SepayPaymentProvider implements PaymentProvider {
  readonly name = 'sepay';

  private readonly bankAccount: string;
  private readonly bankCode: string;
  private readonly accountHolder: string;
  private readonly webhookSecret: string;
  private readonly transferPrefix: string;
  private readonly qrBaseUrl: string;

  constructor(config: ConfigService) {
    this.bankAccount = config.get<string>('sepay.bankAccount') ?? '';
    this.bankCode = config.get<string>('sepay.bankCode') ?? '';
    this.accountHolder = config.get<string>('sepay.accountHolder') ?? '';
    this.webhookSecret = config.get<string>('sepay.webhookSecret') ?? '';
    this.transferPrefix = config.get<string>('sepay.transferPrefix') ?? 'ZENX';
    this.qrBaseUrl = config.get<string>('sepay.qrBaseUrl') ?? 'https://vietqr.app/img';
  }

  async createPayment(input: { paymentNo: string; amountVnd: bigint; coinAmount: bigint; paymentMethod: PaymentMethod }) {
    if (input.paymentMethod !== PaymentMethod.VIETQR) throw new Error('SePay supports VietQR payments only');
    if (!this.bankAccount || !this.bankCode || !this.accountHolder) throw new Error('SePay bank configuration is incomplete');

    const qrUrl = new URL(this.qrBaseUrl);
    qrUrl.searchParams.set('acc', this.bankAccount);
    qrUrl.searchParams.set('bank', this.bankCode);
    qrUrl.searchParams.set('amount', input.amountVnd.toString());
    qrUrl.searchParams.set('des', input.paymentNo);
    qrUrl.searchParams.set('template', 'compact');
    qrUrl.searchParams.set('showinfo', 'true');
    qrUrl.searchParams.set('holder', this.accountHolder);

    return {
      providerTransactionId: null,
      paymentUrl: null,
      qrImageUrl: qrUrl.toString(),
      displayMetadata: this.getDisplayMetadata(input.paymentMethod),
      status: 'PENDING' as const,
    };
  }

  async verifyCallback(_input: { rawBody: string; signature: string; payload: Record<string, unknown> }): Promise<VerifiedPaymentCallback> {
    throw new Error('SePay callbacks must use the webhook endpoint');
  }

  verifyWebhook(input: { rawBody: string; signature?: string; timestamp?: string }): void {
    if (!this.webhookSecret) throw new InvalidSepayWebhookError('SePay webhook secret is not configured');
    const signature = input.signature?.trim() ?? '';
    const timestampValue = Number(input.timestamp);
    if (!signature || !Number.isInteger(timestampValue) || Math.abs(Math.floor(Date.now() / 1000) - timestampValue) > 300) {
      throw new InvalidSepayWebhookError('Invalid or expired SePay webhook timestamp');
    }
    if (!signature.startsWith('sha256=')) throw new InvalidSepayWebhookError('Invalid SePay webhook signature format');

    const actual = Buffer.from(signature.slice('sha256='.length), 'hex');
    const expected = createHmac('sha256', this.webhookSecret).update(`${timestampValue}.${input.rawBody}`).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new InvalidSepayWebhookError('Invalid SePay webhook signature');
    }
  }

  async queryPayment(_input: { providerTransactionId: string }) { return 'PENDING' as const; }

  getDisplayMetadata(paymentMethod: PaymentMethod) {
    return {
      method: paymentMethod,
      label: 'VietQR',
      flow: 'QR',
      provider: this.name,
      bankAccount: this.bankAccount || undefined,
      bankCode: this.bankCode || undefined,
      accountHolder: this.accountHolder || undefined,
      transferPrefix: this.transferPrefix,
    };
  }
}
