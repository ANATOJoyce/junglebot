import { IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreatePromotionConditionDto {
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  allowedUsers?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  allowedProducts?: string[];
}
