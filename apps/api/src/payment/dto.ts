import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentDto {
  @IsUUID() coinPackageId!: string;
  @IsString() @IsIn(['MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CARD', 'VIETQR', 'QR', 'REDIRECT']) paymentMethod!: string;
  @IsOptional() @IsString() @MaxLength(255) idempotencyKey?: string;
}

export class PaymentCallbackDto {
  @IsString() providerTransactionId!: string;
  @IsString() status!: string;
  @IsString() paymentNo!: string;
}

export class SepayWebhookDto {
  @Transform(({ value }) => typeof value === 'number' ? String(value) : value)
  @IsString() @IsNotEmpty() id!: string;
  @IsString() @IsNotEmpty() gateway!: string;
  @IsString() @IsNotEmpty() transactionDate!: string;
  @IsString() @IsNotEmpty() accountNumber!: string;
  @IsOptional() @IsString() subAccount?: string | null;
  @IsOptional() @IsString() code?: string | null;
  @IsString() @IsNotEmpty() content!: string;
  @IsIn(['in', 'out']) transferType!: 'in' | 'out';
  @IsOptional() @IsString() description?: string | null;
  @Transform(({ value }) => typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value)
  @IsNumber() transferAmount!: number;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value) @IsNumber() accumulated?: number | null;
  @IsOptional() @IsString() referenceCode?: string | null;
}
