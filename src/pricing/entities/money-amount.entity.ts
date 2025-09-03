import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Currency } from 'src/currency/entities/currency.entity';
import { Variant } from 'src/product/entities/product-variant.entity';

@Schema({ timestamps: true })
export class MoneyAmount {
  
  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  currency_code: string;

  @Prop({ type: Types.ObjectId, ref: 'Currency' })
  currency?: Types.ObjectId | Currency;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant' })
  variant?: Types.ObjectId | Variant;


  @Prop({ type: Date })
  deleted_at?: Date;
}

export type MoneyAmountDocument = MoneyAmount & Document;
export const MoneyAmountSchema = SchemaFactory.createForClass(MoneyAmount);
