import { IsEmail, IsString } from 'class-validator';

export class VerifyCustomerCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;
}
