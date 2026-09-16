import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

const trim = (value: unknown) => typeof value === 'string' ? value.trim() : value;
export class GameSsoExchangeDto {
  @Transform(({ value }) => trim(value)) @IsString() @MaxLength(512) code!: string;
  @Transform(({ value }) => trim(value)) @IsString() @MaxLength(2048) redirect_uri!: string;
}
