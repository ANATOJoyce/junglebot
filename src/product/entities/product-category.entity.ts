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
  @Prop({unique: true})
  name: string;

  @Prop({ index: true })
  description: string;

  @Prop({ type: String, enum: Visibility, default: Visibility.PRIVATE })
  visibility: Visibility;


}

export const ProductCategorySchema = SchemaFactory.createForClass(ProductCategory);