import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsMongoId } from 'class-validator';
import { OrderStatus } from '../order-status.enum';

export class CreateOrderDto {
 

 @IsNumber()
  @IsNotEmpty()
  display_id: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus = OrderStatus.PENDING;

  @IsString()
  @IsNotEmpty()
  currency_code: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  items?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  credit_lines?: string[];

  @IsMongoId()
  @IsOptional()
  customer_id?: string;
}
