import { Module } from '@nestjs/common';
import { InventaireController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { MailService } from 'src/mail/mail.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './entities/inventory.entity';

@Module({

  imports: [
    MongooseModule.forFeature([{ name: Inventory.name, schema: InventorySchema }]),
  ],
  controllers: [InventaireController],
  providers: [InventoryService, MailService],
})
export class InventoryModule {}
