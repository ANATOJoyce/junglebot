import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './entities/cart.entity';
import { LineItem, LineItemSchema } from './entities/line-item.entity';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: LineItem.name, schema: LineItemSchema },
    ]),
  ],
  controllers: [CartController],   // ← Assure-toi qu’il est ici
  providers: [CartService],
})

export class CartModule {}
