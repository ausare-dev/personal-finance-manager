import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { TransactionType } from '../../entities/transaction.entity';

export class UpdateTransactionDto {
  @IsUUID()
  @IsOptional()
  walletId?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

