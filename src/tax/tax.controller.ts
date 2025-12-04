import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, NotFoundException } from '@nestjs/common';
import { TaxService } from './tax.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/role.enum';
import { Tax } from './entities/tax.entity';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // Création d'une taxe
  @Post()
  @Roles(Role.ADMIN, Role.VENDOR)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createTaxDto: CreateTaxDto): Promise<Tax> {
    return this.taxService.createTax(createTaxDto);  // Appel de la méthode createTax du service
  }

  // Récupérer toutes les taxes
  @Get()
  @Roles(Role.ADMIN, Role.CUSTOMER, Role.VENDOR)
  async findAll(): Promise<Tax[]> {
    return this.taxService.findAll();
  }

  // Mettre à jour une taxe existante
  @Patch(':id')
  @Roles(Role.ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() updateTaxDto: UpdateTaxDto): Promise<Tax> {
    const updatedTax = await this.taxService.update(id, updateTaxDto);
    if (!updatedTax) {
      throw new NotFoundException(`Tax with id ${id} not found`);  // Gestion de l'erreur si la taxe n'existe pas
    }
    return updatedTax;
  }

  // Supprimer une taxe
  @Delete(':id')
  @Roles(Role.ADMIN, Role.VENDOR)
  async remove(@Param('id') id: string): Promise<void> {
    await this.taxService.remove(id);  // Aucun retour attendu, juste la suppression
  }
}
