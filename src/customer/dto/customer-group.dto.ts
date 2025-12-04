import { IsNotEmpty, IsOptional, IsString, IsArray, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCustomerGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  customers?: Types.ObjectId[];

  @IsMongoId()
  @IsNotEmpty()
  storeId: string; // 
}

export class UpdateCustomerGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @IsOptional()
  customers?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId()
  storeId?: string;
}
