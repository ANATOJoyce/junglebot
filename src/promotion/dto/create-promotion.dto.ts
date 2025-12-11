import { IsEnum, IsMongoId, IsOptional, IsString, IsArray, IsDate, IsNotEmpty } from 'class-validator';
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

  @IsString()
  @IsOptional()
  Promotion_value?: string; // Montant ou pourcentage

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  taxe_include?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  condition?: string[];

  @IsString()
  @IsOptional()
  operateur?: string;

  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  discount?: string;

  @IsString()
  @IsOptional()
  Max_quantity?: string;

  @IsString()
  @IsOptional()
  Min_quantity?: string;

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
