// dto/authenticate-customer.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class AuthenticateCustomerDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
