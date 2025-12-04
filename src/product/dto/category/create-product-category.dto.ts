import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { Visibility } from 'src/product/entities/product-category.entity';

export class CreateProductCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsString()
  handle?: string;

  @IsOptional()
  @IsArray()
  @Type(() => String)
  products?: Types.ObjectId[];
}
