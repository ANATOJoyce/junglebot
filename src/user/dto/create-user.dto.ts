import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../auth/role.enum';

export class CreateUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  phone: string;

 @IsEnum(Role)  // Validation explicite pour l'énumération Role
 @IsOptional()  // Si tu veux rendre "role" optionnel (si non fourni, tu peux affecter une valeur par défaut dans le service)
  role?: Role;

}


