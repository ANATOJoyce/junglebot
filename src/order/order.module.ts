import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Order, OrderSchema } from './entities/CommandePrincipale/order.entity';
import { Cart, CartSchema } from 'src/cart/entities/cart.entity';
import { Store, StoreSchema } from 'src/store/entities/store.entity';
import { Return, ReturnSchema } from './entities/Retours&Réclamations/return.entity';
import { Payment, PaymentSchema } from 'src/payment/entities/payment.entity';
import { Notification, NotificationSchema } from 'src/notification/notification.entity';
import { Customer, CustomerSchema } from 'src/customer/entities/customer.entity';
import { Product, ProductSchema } from 'src/product/entities/product.entity';

import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';

import { CartModule } from 'src/cart/cart.module';
import { CustomerModule } from 'src/customer/customer.module';
import { PaymentModule } from 'src/payment/payment.module';
import { StoreModule } from 'src/store/store.module';
import { NotificationModule } from 'src/notification/notification.module';
import { MailModule } from 'src/mail/mail.module';
import { ProductModule } from 'src/product/product.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Return.name, schema: ReturnSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Product.name, schema: ProductSchema },
    ]),

    CartModule,
    forwardRef(() => CustomerModule), // ✅ FIX PRINCIPAL
    PaymentModule,
    StoreModule,
    NotificationModule,
    MailModule,
    ProductModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrderModule {}
