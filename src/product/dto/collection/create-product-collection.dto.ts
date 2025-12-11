import { IsString, IsNotEmpty, IsArray, IsEnum, IsOptional } from 'class-validator';

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['draft', 'published'])
  status: 'draft' | 'published';
}