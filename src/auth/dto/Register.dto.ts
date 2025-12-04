import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../role.enum';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;


}
