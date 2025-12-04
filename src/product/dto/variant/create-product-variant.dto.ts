import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class CreateVariantDto {
  @IsMongoId()
  productId: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNumber()
  price: number;

  @IsNumber()
  stock?: number;
}
