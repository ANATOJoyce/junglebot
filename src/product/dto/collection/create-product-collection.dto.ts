import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Visibility } from 'src/product/entities/product-category.entity';

export class CreateProductCollectionDto {
  @IsString()
  name: string;

  @IsString()
  handle: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @IsOptional()
  @IsArray()
  products?: string[];
}
