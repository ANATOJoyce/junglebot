import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PromotionBuyXGetY {
  @Prop({ required: true })
  quantityX: number;

  @Prop({ required: true })
  quantityY: number;
}

export type PromotionBuyXGetYDocument = PromotionBuyXGetY & Document;
export const PromotionBuyXGetYSchema = SchemaFactory.createForClass(PromotionBuyXGetY);
