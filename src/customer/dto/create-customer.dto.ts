// src/customer/dto/create-customer.dto.ts
import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { CustomerStatus } from '../entities/customer.entity';

export class CreateCustomerDto {
  
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus; // par défaut NOUVEAU

  @IsString()
  @IsNotEmpty()
  password: string;

}
