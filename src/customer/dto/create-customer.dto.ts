import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  customers?: Types.ObjectId[];

  @IsString()
  @IsNotEmpty()
  storeId: string; 
}

export class UpdateCustomerGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @IsOptional()
  customers?: Types.ObjectId[];

  @IsOptional()
  @IsString()
  storeId?: string;
}
