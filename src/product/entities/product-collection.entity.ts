import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Collection extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: ['draft', 'published'], default: 'published' })
  status: string;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);