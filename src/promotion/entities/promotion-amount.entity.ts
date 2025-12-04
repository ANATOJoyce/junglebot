import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class PromotionAmount {
  @Prop({ required: true, min: 5})
  value: number;

  @Prop()
  maxQuantity?: number; // uniquement pour Amount Off Product ici on peut dire par exemple pour 10 habit payaer vous aver 30% de reductiun
}

export type PromotionAmountDocument = PromotionAmount & Document;
export const PromotionAmountSchema = SchemaFactory.createForClass(PromotionAmount);
