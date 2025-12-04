import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FulfillmentAddress } from './fulfillment-address.entity';
import { FulfillmentItem } from './fulfillment-item.entity';
import { FulfillmentLabel } from './fulfillment-label.entity';
import { FulfillmentProvider } from './fulfillment-provider.entity';
import { ShippingOption } from './shipping-option.entity';

export type FulfillmentDocument = Fulfillment & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret:{ _id?: any; __v?: number; id?: string; password?: string; }) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Fulfillment {
  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () => `ful_${new Types.ObjectId().toString()}`,
  })
  id: string;

  @Prop({ type: String, required: true })
  location_id: string;

  @Prop({ type: Date, default: null })
  packed_at: Date | null;

  @Prop({ type: Date, default: null })
  shipped_at: Date | null;

  @Prop({ type: String, default: null })
  marked_shipped_by: string | null;

  @Prop({ type: String, default: null })
  created_by: string | null;

  @Prop({ type: Date, default: null })
  delivered_at: Date | null;

  @Prop({ type: Date, default: null })
  canceled_at: Date | null;

  @Prop({ type: Object, default: null })
  data: Record<string, any> | null;

  @Prop({ type: Boolean, default: true })
  requires_shipping: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'FulfillmentItem', default: [] })
  items: Types.ObjectId[] | FulfillmentItem[];

  @Prop({ type: [Types.ObjectId], ref: 'FulfillmentLabel', default: [] })
  labels: Types.ObjectId[] | FulfillmentLabel[];

  @Prop({ type: Types.ObjectId, ref: 'FulfillmentProvider', default: null })
  provider: Types.ObjectId | FulfillmentProvider | null;

  @Prop({ type: Types.ObjectId, ref: 'ShippingOption', default: null })
  shipping_option: Types.ObjectId | ShippingOption | null;

  @Prop({ type: Types.ObjectId, ref: 'FulfillmentAddress', default: null })
  delivery_address: Types.ObjectId | FulfillmentAddress | null;

  @Prop({ type: Object, default: null })
  metadata: Record<string, any> | null;

  @Prop({ type: Date, default: null })
  deleted_at: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId; // Lien vers la commande



}

export const FulfillmentSchema = SchemaFactory.createForClass(Fulfillment);

