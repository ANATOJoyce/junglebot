import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchBudgetDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max?: number;
}
