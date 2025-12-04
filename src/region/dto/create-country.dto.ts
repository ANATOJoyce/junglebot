// src/region/dto/create-country.dto.ts
import { IsString, IsNotEmpty, Length, IsNumber, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRegionDto } from './create-region.dto';

export class CreateCountryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Length(2, 2)
  iso2: string;

  @IsString()
  @Length(3, 3)
  iso3: string;

  @IsString()
  @IsNotEmpty()
  currency_code: string;

  @IsNumber()
  @Min(0)
  tax_rate: number; 

  @IsString()
  @IsNotEmpty()
  phoneCode: string; // indicatif téléphonique obligatoire

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRegionDto)
  regions?: CreateRegionDto[];
}
