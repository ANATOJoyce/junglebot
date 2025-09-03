import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentCollection } from './payment-collection.entity';
import { PaymentSession } from './payment-session.entity';
import { Refund } from './refund.entity';
import { Capture } from './capture.entity';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.Decimal128, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  currency_code: string;

  @Prop({ type: String, required: true })
  provider_id: string;

  @Prop({ type: Object, default: null })
  data?: Record<string, any> | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, any> | null;

  @Prop({ type: Date, default: null })
  captured_at?: Date | null;

  @Prop({ type: Date, default: null })
  canceled_at?: Date | null;

  // Relations
  @Prop({ type: Types.ObjectId, ref: 'PaymentCollection', required: true })
  payment_collection: PaymentCollection;

  @Prop({ type: Types.ObjectId, ref: 'PaymentSession', default: null })
  payment_session?: PaymentSession | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Refund' }], default: [] })
  refunds: Refund[];

  @Prop({ enum: ['pending', 'captured', 'refunded'], default: 'pending' })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Capture' }], default: [] })
  captures: Capture[];
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
