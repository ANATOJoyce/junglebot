import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCustomerGroupCustomerDto {
  @IsString()
  @IsNotEmpty()
  created_by: string;

  @IsMongoId()
  @IsNotEmpty()
  customer_group: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  storeId: string; // 
}

export class UpdateCustomerGroupCustomerDto {
  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsMongoId()
  customer_group?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  storeId?: string;
}
