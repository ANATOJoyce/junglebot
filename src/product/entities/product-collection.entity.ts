import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from './product.entity';
import { Store } from 'src/store/entities/store.entity';
import { Visibility } from './product-category.entity';

@Schema({ timestamps: true })
export class ProductCollection extends Document {
  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true, index: true, unique: true })
  handle: string;

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  store: Store;

  @Prop({ type: String, enum: Visibility, default: Visibility.PRIVATE })
  visibility: Visibility;
    
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] })
  products: Product[];
}

export const ProductCollectionSchema = SchemaFactory.createForClass(ProductCollection);

