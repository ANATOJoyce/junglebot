import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { Store } from 'src/store/entities/store.entity';

@Schema({ timestamps: true })
export class Inventory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Product;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId: Store;

  @Prop({ default: 0 })
  quantity: number;
}

export type InventoryDocument = Inventory & Document;
export const InventorySchema = SchemaFactory.createForClass(Inventory);
