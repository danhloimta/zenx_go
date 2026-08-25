import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
