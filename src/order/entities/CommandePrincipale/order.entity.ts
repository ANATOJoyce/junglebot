import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { CreditLine } from 'src/cart/entities/credit-line.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { OrderStatus } from 'src/order/order-status.enum';

export type OrderDocument = Order & Document & { _id: Types.ObjectId };



@Schema({ timestamps: true })
export class Order {

  @Prop({ type: Number, required: true })
  display_id: number;

  @Prop({ type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, required: true })
  currency_code: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'OrderItem' }], default: [] })
  items: OrderItem[]; //les produits

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CreditLine' }], default: [] })
  credit_lines: CreditLine[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', default: null })
  customer_id?: Customer | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Store', required: true })
  store: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Payment' }] })
  payments?: Payment[];

 
}

export const OrderSchema = SchemaFactory.createForClass(Order);
