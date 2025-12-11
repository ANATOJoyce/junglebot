import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Visibility } from 'src/product/entities/product-category.entity';

export class CreateProductCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
