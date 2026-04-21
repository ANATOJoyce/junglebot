// src/cart/dto/update-cart-item-by-name.dto.ts
import { IsNumber, IsOptional, Min, IsString } from 'class-validator';

export class UpdateCartItemByNameDto {
  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  product_name?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
