// promotion-condition.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class PromotionCondition extends Document {
  // Sur quoi la promotion s’applique
  @Prop({ type: String, enum: ['product', 'category', 'order'], required: true })
  targetType: 'product' | 'category' | 'order';

  // Liste des produits ou catégories concernés
  @Prop({ type: [Types.ObjectId], refPath: 'targetType' })
  targets?: Types.ObjectId[];

  // Exemples de filtres additionnels
  @Prop()
  minSubtotal?: number;

  @Prop()
  maxSubtotal?: number;
}

export type PromotionConditionDocument = PromotionCondition & Document;

export const PromotionConditionSchema = SchemaFactory.createForClass(PromotionCondition);
