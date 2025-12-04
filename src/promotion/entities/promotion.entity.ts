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


  @Prop({ unique: true, sparse: true }) // ← Important (ceci peut etre un nombre ou en pourcentage)
  Promotion_value?: string;

  @Prop({ unique: true, sparse: true }) // ← Important
  code?: string;

  @Prop({ unique: true, sparse: true }) // ← Important
  taxe_include?: string;

  @Prop({ unique: true, sparse: true }) // ← Important ()
  condition?: string[];

  @Prop({ unique: true, sparse: true }) // ← Important
  value?: string;

  @Prop({ unique: true, sparse: true }) // ← Important( c'est dans le cas oiu c'est un amount of produit on l"applique a soit tout les produits ou quelque nombre de produit seulement, )
  discount?: string;

  @Prop({ unique: true, sparse: true }) // ← Important'(amount of product lorsque discount est a once pour choisir combien de quantité il doit y avoir dans le panier avant de pouvoir applique la regle )
  Max_quantity?: string;

  @Prop({ unique: true, sparse: true }) // ← Important'(amount of product lorsque discount est a once pour choisir combien de quantité il doit y avoir dans le panier avant de pouvoir applique la regle )
  Min_quantity?: string;


  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaign?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Store' })
  store?: Types.ObjectId;

}


export type PromotionDocument = Promotion & Document;
export const PromotionSchema = SchemaFactory.createForClass(Promotion);
