import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpdateWalletDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter uppercase code (e.g., USD, EUR, RUB)' })
  currency?: string;
}

