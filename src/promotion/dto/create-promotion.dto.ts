import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { PromotionMethod } from '../promotion-methode.enum';
import { PromotionStatus } from '../enum-promotion';
import { PromotionType } from '../entities/promotion-type.enum';
import { Type } from 'class-transformer';

export class CreatePromotionDto {
  @IsEnum(PromotionType)
  type: PromotionType;

  @IsEnum(PromotionMethod)
  method: PromotionMethod;

  @IsEnum(PromotionStatus)
  @IsOptional()
  status?: PromotionStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  promotionValue?: number; // Montant ou pourcentage

  @IsString()
  @IsOptional()
  code?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  taxeInclude?: boolean;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  condition?: string[];

  @IsString()
  @IsOptional()
  operateur?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @IsString()
  @IsOptional()
  discount?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minQuantity?: number;

  @Type(() => Date)   // 👈 transforme la string en Date
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @Type(() => Date)   // 👈 idem pour endDate
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @IsMongoId()
  @IsOptional()
  campaign?: string;
}