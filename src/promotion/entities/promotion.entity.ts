import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PromotionStatus } from '../enum-promotion';
import { PromotionMethod } from '../promotion-methode.enum';
import { PromotionType } from './promotion-type.enum';

@Schema({ timestamps: true })
export class Promotion extends Document {
  @Prop({ required: true, enum: PromotionType, default: PromotionType.AMOUNT_OFF_ORDER })
  type: PromotionType;

  @Prop({ required: true, enum: PromotionMethod, default: PromotionMethod.AUTOMATIC })
  method: PromotionMethod;

  @Prop({ type: String, enum: PromotionStatus, default: PromotionStatus.DRAFT })
  status: PromotionStatus;

  @Prop({ required: false })
  promotionValue?: number;   //  number au lieu de string

  @Prop({ unique: true, sparse: true })
  code?: string;

  @Prop({ required: false })
  taxeInclude?: boolean;     // ⚡ boolean au lieu de string

  @Prop({ required: false })
  condition?: string[];

  @Prop({ required: true })
  value: number;

  @Prop({ required: false })
  discount?: string;

  @Prop({ required: false })
  maxQuantity?: number;      //  number

  @Prop({ required: false })
  minQuantity?: number;      //  number

  @Prop({ required: false })
  startDate?: Date;          //  Date

  @Prop({ required: false })
  endDate?: Date;            //  Date

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaign?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store' })
  store?: Types.ObjectId;
}

export type PromotionDocument = Promotion & Document;
export const PromotionSchema = SchemaFactory.createForClass(Promotion);
