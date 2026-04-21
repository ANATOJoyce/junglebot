import { IsMongoId, IsArray, ArrayMinSize, IsOptional, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsNotEmpty()
  @IsMongoId()
  customer: string;

  @IsArray()
  @ArrayMinSize(1)
  items: {
    product: string;
    quantity: number;
  }[];


}
