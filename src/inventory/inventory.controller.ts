import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventaire')
export class InventaireController {
  constructor(private readonly inventoryService: InventoryService) {}

@Get('store/:storeId')
async getInventaire(@Param('storeId') storeId: string): Promise<any> {
  return this.inventoryService.checkInventaire(storeId);
}

}
