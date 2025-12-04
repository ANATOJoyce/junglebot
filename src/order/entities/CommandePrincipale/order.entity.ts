import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { Cart } from 'src/cart/entities/cart.entity';
import { OrderStatus } from 'src/order/order-status.enum';


@Schema({ timestamps: true })
export class Order extends Document {
  

  @Prop({ type: Number, unique: true })
  display_id: number;
  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: User;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true },
    },
  ])
  items: { product: Product; quantity: number; price: number }[];

  @Prop({ default: 0 })
  total: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  cart?: Cart; // Lien vers le panier d’origine

  createdAt?: Date;
  updatedAt?: Date;

}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
