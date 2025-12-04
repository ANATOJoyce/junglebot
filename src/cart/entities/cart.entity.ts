import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';

export enum CartStatus {
  ACTIVE = 'active',
  ORDERED = 'ordered',
  CANCELLED = 'cancelled',
}


@Schema({ timestamps: true })


export class Cart extends Document {


  
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1 },
    },
  ])
  items: { product: Product; quantity: number }[];
  

   @Prop({ type: Number, default: 0 })
  total: number;
 
  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order?: Types.ObjectId; // lien vers la commande créée à partir de ce panier

@Prop({ 
  type: String, 
  enum: CartStatus,    // ici on définit l'enum
  default: CartStatus.ACTIVE 
})
status: CartStatus;
}


export type CartDocument = Cart & Document;

export const CartSchema = SchemaFactory.createForClass(Cart);
