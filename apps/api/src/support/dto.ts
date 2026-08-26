import { SupportTicketStatus } from '../common/domain';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, IsIn, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsUUID()
  categoryId!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  description!: string;
}

export class SupportTicketsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50])
  pageSize = 10;

  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;
}
