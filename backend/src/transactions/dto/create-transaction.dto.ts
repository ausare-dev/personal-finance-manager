import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { TransactionType } from '../../entities/transaction.entity';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;
}

