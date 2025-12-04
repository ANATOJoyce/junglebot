import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePromotionTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
