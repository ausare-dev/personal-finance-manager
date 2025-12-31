import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  assetName: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  purchasePrice: number;

  @IsNumber()
  @Min(0.01)
  currentPrice: number;

  @IsDateString()
  purchaseDate: string;
}

