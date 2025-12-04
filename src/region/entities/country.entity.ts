import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Region } from './region.entity';

export type CountryDocument = Country & Document;

@Schema({ timestamps: true })
export class Country {
  @Prop({ required: true, unique: true, index: true })
  name: string; // Ex: "France", "Nigeria"

  @Prop({ required: true, unique: true, length: 2 })
  iso2: string; // Ex: "FR", "NG"

  @Prop({ required: true, unique: true, length: 3 })
  iso3: string; // Ex: "FRA", "NGA"

  @Prop({ required: true })
  currency_code: string; // Ex: "EUR", "NGN"

  @Prop({ default: 0 }) // taux de TVA par défaut, ex: 18
  tax_rate: number;

  @Prop({ required: true })
  phoneCode: string; // Ex: "+33", "+228"

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Region' }] })
  regions: Region[];
}

export const CountrySchema = SchemaFactory.createForClass(Country);
