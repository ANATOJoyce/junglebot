import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Order } from './order.entity';
import { Product } from 'src/product/entities/product.entity';

export type OrderItemDocument = OrderItem & Document;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId | Order;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId | Product;

  @Prop({ type: String, required: true })
  product_name: string; // copié du produit pour l'historique

  @Prop({ type: Number, required: true })
  quantity: number; // choisi par le client

  @Prop({ type: Number, required: true })
  unit_price: number; // prix à la commande

  @Prop({ type: Number, default: 0 })
  fulfilled_quantity: number; // livré

  @Prop({ type: Number, default: 0 })
  shipped_quantity: number; // expédié

  @Prop({ type: Number, default: 0 })
  return_requested_quantity: number; // retours demandés

  @Prop({ type: Number, default: 0 })
  return_received_quantity: number; // retours reçus

  @Prop({ type: Number, default: 0 })
  return_dismissed_quantity: number; // retours annulés

  @Prop({ type: Number, default: 0 })
  written_off_quantity: number; // articles radiés

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
