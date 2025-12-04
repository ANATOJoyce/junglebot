// verify-account.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyAccountDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
