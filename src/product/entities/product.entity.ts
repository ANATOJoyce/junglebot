import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { ProductStatus } from "../product-enum";
import { request } from "http";
import { Promotion } from "src/promotion/entities/promotion.entity";
import { Variant } from "./product-variant.entity";

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.DRAFT })  // Utilisation de l'enum pour le status
  status: ProductStatus;

  @Prop({ required: true, default: 0 })  // Stock global du produit
  totalStock: number;

  @Prop({ required: false })
  description: string;

  @Prop({required:true})  // Le champ images sera un tableau de chaînes de caractères
  imageUrl: String;

  @Prop({ required: true })
  price: number;
  // 👇 Champ booléen pour savoir si le produit est en promotion
  @Prop({ default: false })
  isPromotion: boolean;

  // 👇 Référence vers la collection Promotion
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Promotion' }] })
  promotions: Promotion[];

  @Prop({ type: Types.ObjectId, ref: 'ProductCategory', required: true })
  category: string;

  
  @Prop({ type: Types.ObjectId, ref: 'Collection', required: false })
  collection?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Variant' }] })
  variants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Store', required: true })
  storeId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
