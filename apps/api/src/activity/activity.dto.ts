import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class ActivityLogsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @IsIn([10, 20, 50]) pageSize = 20;
  @IsOptional() @IsIn(['ALL', 'LOGIN', 'SECURITY']) category: 'ALL' | 'LOGIN' | 'SECURITY' = 'ALL';
}
