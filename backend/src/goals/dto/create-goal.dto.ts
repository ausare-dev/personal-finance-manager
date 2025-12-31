import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @IsDateString()
  deadline: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  currentAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRate?: number;
}

