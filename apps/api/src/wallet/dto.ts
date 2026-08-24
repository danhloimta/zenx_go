import { WalletTransactionStatus, WalletTransactionType } from '../common/domain';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class WalletTransactionsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsEnum(WalletTransactionType) type?: WalletTransactionType;
  @IsOptional() @IsEnum(WalletTransactionStatus) status?: WalletTransactionStatus;
}
