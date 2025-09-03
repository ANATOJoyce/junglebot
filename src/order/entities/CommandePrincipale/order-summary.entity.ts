// order-summary.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Order } from './order.entity';
export type OrderSummaryDocument = OrderSummary & Document;

@Schema({
  timestamps: true,
  collection: 'order_summaries',
  toJSON: {
    virtuals: true,
transform: (
  doc,
  ret: { _id?: any; __v?: number; id?: string }
) => {
  ret.id = `${doc._id.toString()}`;
  delete ret._id;
  delete ret.__v;
  return ret;
}


  },
})
export class OrderSummary {
  @Prop({ default: 1 })
  version: number;

  @Prop({ type: Object, required: true })
  totals: Record<string, unknown>;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true, // Since it's a one-to-one relationship
  })
  order: Types.ObjectId | Order;

  @Prop({ type: Date })
  deleted_at?: Date;
}

export const OrderSummarySchema = SchemaFactory.createForClass(OrderSummary);

