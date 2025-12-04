import {
  IsEnum,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsMongoId,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionMethod } from '../promotion-methode.enum';
import { PromotionStatus } from '../enum-promotion';
import { PromotionType } from '../entities/promotion-type.enum';

class BuyXGetYDetailsDto {
  @IsInt()
  @Min(1)
  quantityX: number;

  @IsInt()
  @Min(1)
  quantityY: number;
}
