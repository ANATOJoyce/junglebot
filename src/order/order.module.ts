import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/CommandePrincipale/order.entity';
import { OrderItem, OrderItemSchema } from './entities/CommandePrincipale/order-item.entity';
import { OrderShippingMethod, OrderShippingMethodSchema } from './entities/Taxes&Adjustments/order-shipping-method.entity';
import { OrderLineItemAdjustment, OrderLineItemAdjustmentSchema } from './entities/Taxes&Adjustments/line-item-adjustment.entity';
import { OrderShippingMethodAdjustment, OrderShippingMethodAdjustmentSchema } from './entities/Taxes&Adjustments/order-shipping-method-adjustment.entity';
import { OrderLineItemTaxLine, OrderLineItemTaxLineSchema } from './entities/Taxes&Adjustments/line-item-tax-line.entity';
import { OrderShippingMethodTaxLine, OrderShippingMethodTaxLineSchema } from './entities/Taxes&Adjustments/order-shipping-method-tax-line.entity';
import { OrderCreditLine, OrderCreditLineSchema } from './entities/Transaction/credit-line.entity';
import { OrderTransaction, OrderTransactionSchema } from './entities/Transaction/transaction.entity';
import { OrderAddress, OrderAddressSchema } from './entities/CommandePrincipale/address.entity';
import { Cart, CartSchema } from 'src/cart/entities/cart.entity';
import { Store, StoreSchema } from 'src/store/entities/store.entity';
import { Return, ReturnSchema } from './entities/Retours&Réclamations/return.entity';
import { Payment, PaymentSchema } from 'src/payment/entities/payment.entity';
import { PaymentModule } from 'src/payment/payment.module';
import { OrdersService } from './order.service';
import { OrdersController } from './order.controller';
import { StoreModule } from 'src/store/store.module';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationModule } from 'src/notification/notification.module';
import { Notification, NotificationSchema } from 'src/notification/notification.entity';  // Ajoute cette ligne ici
import { CustomerModule } from 'src/customer/customer.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: OrderShippingMethod.name, schema: OrderShippingMethodSchema },
      { name: OrderLineItemAdjustment.name, schema: OrderLineItemAdjustmentSchema },
      { name: OrderShippingMethodAdjustment.name, schema: OrderShippingMethodAdjustmentSchema },
      { name: OrderLineItemTaxLine.name, schema: OrderLineItemTaxLineSchema },
      { name: OrderShippingMethodTaxLine.name, schema: OrderShippingMethodTaxLineSchema },
      { name: OrderCreditLine.name, schema: OrderCreditLineSchema },
      { name: OrderTransaction.name, schema: OrderTransactionSchema },
      { name: OrderAddress.name, schema: OrderAddressSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Store.name, schema: StoreSchema },
      { name: Return.name, schema: ReturnSchema },
      { name: Payment.name, schema: PaymentSchema }, 
      { name: Notification.name, schema: NotificationSchema },  // Notification maintenant reconnu
    ]),
     CustomerModule,
    PaymentModule, 
    StoreModule,
    NotificationModule
  ],
  providers: [OrdersService, NotificationService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrderModule {}
