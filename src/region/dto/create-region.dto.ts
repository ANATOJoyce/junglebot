import { IsString, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name: string;
}
