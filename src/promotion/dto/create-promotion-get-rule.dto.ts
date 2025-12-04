import { IsNumber, IsOptional, IsEnum, IsArray, IsString } from 'class-validator';

export enum PromotionGetRuleScope {
  PRODUCT = 'product',
  PRODUCT_CATEGORY = 'product_category',
}

export enum PromotionGetRuleOperator {
  IN = 'in',
  NOT_IN = 'not_in',
}

export class CreatePromotionGetRuleDto {
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsEnum(PromotionGetRuleScope)
  condition_scope?: PromotionGetRuleScope;

  @IsOptional()
  @IsEnum(PromotionGetRuleOperator)
  condition_operator?: PromotionGetRuleOperator;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  condition_values?: string[];
}
