// add-cart-item.dto.ts
import { IsString, IsOptional, IsNumber, IsMongoId } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  sessionId: string;

  @IsMongoId()
  product: string;

  
  @IsNumber()
  quantity: number;
}
