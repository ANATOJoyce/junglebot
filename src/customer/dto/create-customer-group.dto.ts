import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCustomerGroupCustomerDto {
  @IsString()
  @IsNotEmpty()
  created_by: string;

  @IsNotEmpty()
  customer_group: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  storeId: string; // 
}

export class UpdateCustomerGroupCustomerDto {
  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  customer_group?: Types.ObjectId;

  @IsOptional()
  @IsString()
  storeId?: string;
}
