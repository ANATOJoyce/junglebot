import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Payment } from './payment.entity';
import { Order } from 'src/order/entities/CommandePrincipale/order.entity';

export type PaymentCollectionDocument = PaymentCollection & Document;

@Schema({ timestamps: true })
export class PaymentCollection {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Order;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ enum: ['pending', 'partially_paid', 'paid'], default: 'pending' })
  status: string;

  // Relation avec les paiements
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Payment' }], default: [] })
  payments: Payment[];
}

export const PaymentCollectionSchema = SchemaFactory.createForClass(PaymentCollection);
