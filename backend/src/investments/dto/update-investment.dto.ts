import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class UpdateInvestmentDto {
  @IsString()
  @IsOptional()
  assetName?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  purchasePrice?: number;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  currentPrice?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;
}

