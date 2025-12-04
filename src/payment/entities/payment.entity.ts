import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  userId: string;

 @Prop({ type: [String], required: true })
  orderIds: string[]; 

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  txReference: string; // référence interne unique

  @Prop({ required: true })
  network: string; // TMONEY, FLOOZ, etc.

  @Prop({ default: 'pending' })
  status: string; // pending, completed, failed

  @Prop()
  paymentMethod?: string; 

  @Prop()
  externalReference?: string; // référence PayGate
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
