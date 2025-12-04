import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionType } from '../entities/promotion-type.enum';
import { PromotionMethod } from '../promotion-methode.enum';
import { PromotionStatus } from '../enum-promotion';

export class AmountDetailsDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  maxQuantity?: number | null;
}
