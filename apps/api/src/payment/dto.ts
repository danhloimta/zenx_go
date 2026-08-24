import { IsIn, IsString, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID() coinPackageId!: string;
  @IsString() @IsIn(['QR', 'REDIRECT']) paymentMethod!: string;
}

export class PaymentCallbackDto {
  @IsString() providerTransactionId!: string;
  @IsString() status!: string;
  @IsString() paymentNo!: string;
  @IsString() signature!: string;
}
