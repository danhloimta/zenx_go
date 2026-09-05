import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  CoinPackageStatus,
  PaymentMethod,
  PaymentStatus,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../../common/domain';

const PAGE_SIZES = [10, 20, 50, 100] as const;
const DECIMAL_INTEGER = /^\d+$/;

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimOrUndefined(value: unknown) {
  const normalized = trim(value);
  return normalized === '' ? undefined : normalized;
}

export class AdminFinancePageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn(PAGE_SIZES) pageSize = 20;
}

export class AdminFinancePackagesQueryDto {
  @IsOptional() @IsIn(Object.values(CoinPackageStatus)) status?: CoinPackageStatus;
}

export class AdminFinanceCoinPackageCreateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString() @Matches(/^[A-Z0-9_]{2,32}$/)
  code!: string;

  @Transform(({ value }) => trim(value))
  @IsString() @MinLength(1) @MaxLength(120)
  name!: string;

  @Transform(({ value }) => trim(value))
  @IsString() @Matches(DECIMAL_INTEGER)
  priceVnd!: string;

  @Transform(({ value }) => trim(value))
  @IsString() @Matches(DECIMAL_INTEGER)
  coinAmount!: string;

  @IsOptional() @IsIn(Object.values(CoinPackageStatus)) status: CoinPackageStatus = CoinPackageStatus.ACTIVE;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000) sortOrder = 0;
}

export class AdminFinanceCoinPackageUpdateDto {
  @IsDateString() expectedUpdatedAt!: string;
  @Transform(({ value }) => trim(value))
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  name?: string;
  @Transform(({ value }) => trim(value))
  @IsOptional() @IsString() @Matches(DECIMAL_INTEGER)
  priceVnd?: string;
  @Transform(({ value }) => trim(value))
  @IsOptional() @IsString() @Matches(DECIMAL_INTEGER)
  coinAmount?: string;
  @IsOptional() @IsIn(Object.values(CoinPackageStatus)) status?: CoinPackageStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1_000_000) sortOrder?: number;
}

export class AdminFinancePaymentsQueryDto extends AdminFinancePageDto {
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsIn(Object.values(PaymentStatus)) status?: PaymentStatus;
  @IsOptional() @IsString() @MaxLength(64) provider?: string;
  @IsOptional() @IsIn(Object.values(PaymentMethod)) paymentMethod?: PaymentMethod;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() from?: string;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() to?: string;
}

export class AdminFinanceTransactionsQueryDto extends AdminFinancePageDto {
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsIn(Object.values(WalletTransactionType)) type?: WalletTransactionType;
  @IsOptional() @IsIn(Object.values(WalletTransactionStatus)) status?: WalletTransactionStatus;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() from?: string;
  @IsOptional() @Transform(({ value }) => trimOrUndefined(value)) @IsDateString() to?: string;
}

export class AdminFinancePaymentActionDto {
  @IsDateString() expectedUpdatedAt!: string;
}

export class AdminFinanceConfirmPaymentDto extends AdminFinancePaymentActionDto {
  @Transform(({ value }) => trimOrUndefined(value))
  @IsOptional() @IsString() @MaxLength(255)
  providerTransactionId?: string;
  @IsOptional() @IsDateString() paidAt?: string;
}

export class AdminFinanceWalletAdjustmentDto {
  @IsUUID() clientRequestId!: string;
  @Transform(({ value }) => trim(value))
  @IsString() @Matches(DECIMAL_INTEGER)
  amount!: string;
  @Transform(({ value }) => trimOrUndefined(value))
  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}
