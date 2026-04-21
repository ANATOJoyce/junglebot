import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { OrderStatus } from 'src/order/order-status.enum';
import { Customer } from 'src/customer/entities/customer.entity';


@Schema({ timestamps: true })
export class Order extends Document {
@Prop({ type: String, unique: true })
display_id: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: [{ product: { type: Types.ObjectId, ref: 'Product' }, quantity: Number }] })
  items: { product: Product; quantity: number }[];

  @Prop({ default: 0 })
  total: number;

  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  cart?: Cart;
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);