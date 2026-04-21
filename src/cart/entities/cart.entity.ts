// src/cart/entities/cart.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CartItem, CartItemSchema } from './cart-item.entity';
import { User } from 'src/user/entities/user.entity';
import { Customer } from 'src/customer/entities/customer.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ORDERED = 'ordered',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Cart extends Document {
 @Prop({ type: String, required: false, unique: true , default: null})
  sessionId?: string | null;


  @Prop({ type: Types.ObjectId, ref: Customer.name, required: false })  // customerId optionnel
  customer?: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order?: Types.ObjectId; 

  @Prop({
    type: String,
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
export type CartDocument = Cart & Document;
