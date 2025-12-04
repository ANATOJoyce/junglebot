import { IsMongoId, IsArray, ArrayMinSize, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateCartDto {
  @IsMongoId()
  customer: string;

  @IsArray()
  @ArrayMinSize(1)
  items: {
    product: string;
    quantity: number;
  }[];


}
