import { WalletTransactionStatus, WalletTransactionType } from '../common/domain';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class WalletTransactionsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50, 100]) pageSize = 20;
  @IsOptional() @IsEnum(WalletTransactionType) type?: WalletTransactionType;
  @IsOptional() @IsEnum(WalletTransactionStatus) status?: WalletTransactionStatus;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value) @IsDateString() from?: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value) @IsDateString() to?: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value) @IsString() @MaxLength(100) search?: string;
}
