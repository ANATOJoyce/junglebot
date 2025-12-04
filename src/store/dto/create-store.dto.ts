import { IsMongoId, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { StoreStatus } from '../update-store-status.dto';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsNotEmpty()
  country: string; // ID de la région choisie

  @IsMongoId()
  @IsNotEmpty()
  owner: string; // ID du vendeur connecté

  @IsOptional()
  @IsString()
  supported_currencies?: string; // sera défini automatiquement côté service

  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;
}
