import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  phoneNumber: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['FLOOZ', 'TMONEY'])
  network: 'FLOOZ' | 'TMONEY';

  @IsString()
  userId: string;
}
