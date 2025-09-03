import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true, 
  collection: 'order_addresses', 
  autoIndex: true, 
   id: true,
})
export class OrderAddress extends Document {
@Prop({
  type: String,
  default: () => `${crypto.randomUUID()}`,
  required: true,
  unique: true,
})


  @Prop({ type: String, index: true, required: false })
  customer_id?: string;

  @Prop({ type: String, index: true, required: false })
  company?: string;

  @Prop({ type: String, index: true, required: false })
  first_name?: string;

  @Prop({ type: String, index: true, required: false })
  last_name?: string;

  @Prop({ type: String, index: true, required: false })
  address_1?: string;

  @Prop({ type: String, index: true, required: false })
  address_2?: string;

  @Prop({ type: String, index: true, required: false })
  city?: string;

  @Prop({ type: String, required: false })
  country_code?: string;

  @Prop({ type: String, index: true, required: false })
  province?: string;

  @Prop({ type: String, index: true, required: false })
  postal_code?: string;

  @Prop({ type: String, index: true, required: false })
  phone?: string;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const OrderAddressSchema = SchemaFactory.createForClass(OrderAddress);

