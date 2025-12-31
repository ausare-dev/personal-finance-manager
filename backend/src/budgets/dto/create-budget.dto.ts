import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { BudgetPeriod } from '../../entities/budget.entity';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0.01)
  limit: number;

  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;
}

