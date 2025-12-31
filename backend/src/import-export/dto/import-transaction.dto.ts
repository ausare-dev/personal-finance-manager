import {
  IsNumber,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { TransactionType } from '../../entities/transaction.entity';

export class ImportTransactionDto {
  @IsString()
  walletId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  date: string;
}

