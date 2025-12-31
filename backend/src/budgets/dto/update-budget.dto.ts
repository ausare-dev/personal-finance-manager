import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { BudgetPeriod } from '../../entities/budget.entity';

export class UpdateBudgetDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  limit?: number;

  @IsEnum(BudgetPeriod)
  @IsOptional()
  period?: BudgetPeriod;
}

