import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Customer, CustomerSchema } from 'src/customer/entities/customer.entity';
import { Order, OrderSchema } from 'src/order/entities/CommandePrincipale/order.entity';
import { Product, ProductSchema } from 'src/product/entities/product.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Customer.name, schema: CustomerSchema },
       { name: Product.name, schema: ProductSchema }, 
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
