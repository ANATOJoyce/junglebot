import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './entities/payment.entity';
import { PaymentSession, PaymentSessionSchema } from './entities/payment-session.entity';
import { PaymentCollection, PaymentCollectionSchema } from './entities/payment-collection.entity';
import { Refund, RefundSchema } from './entities/refund.entity';
import { Capture, CaptureSchema } from './entities/capture.entity';
import { Order, OrderSchema } from 'src/order/entities/CommandePrincipale/order.entity';
import { Transaction, TransactionSchema } from './entities/transaction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PaymentCollection.name, schema: PaymentCollectionSchema },
      { name: PaymentSession.name, schema: PaymentSessionSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: Capture.name, schema: CaptureSchema },
      { name: Order.name, schema: OrderSchema },
      {name: Transaction.name, schema: TransactionSchema}


    ]),
  ],
  controllers: [PaymentController], // si tu as un contrôleur
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
