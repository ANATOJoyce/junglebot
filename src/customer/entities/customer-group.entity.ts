import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Customer } from './customer.entity';

export type CustomerGroupDocument = CustomerGroup & Document;

@Schema({timestamps: true,})
export class CustomerGroup {

  @Prop({ type: String, required: true, index: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Customer' }] })
  customers: Customer[];
  
  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId: Types.ObjectId;

  @Prop()
  deleted_at: Date;
}

export const CustomerGroupSchema = SchemaFactory.createForClass(CustomerGroup);

