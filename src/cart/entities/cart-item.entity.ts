// src/cart/entities/cart-item.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';

@Schema()
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  quantity: number;

 @Prop({ type: Number, required: true })
  price: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
