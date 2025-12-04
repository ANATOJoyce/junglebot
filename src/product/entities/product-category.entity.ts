import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.entity';
import { Store } from 'src/store/entities/store.entity';

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Schema({ timestamps: true })
export class ProductCategory extends Document {
  @Prop()
  name: string;

  @Prop({ index: true })
  description: string;

  @Prop({ type: String, enum: Visibility, default: Visibility.PRIVATE })
  visibility: Visibility;

  @Prop({ index: true })
  handle: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Store;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  products: Product[];
}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);