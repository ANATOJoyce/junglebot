import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePromotionMethodDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;
}
