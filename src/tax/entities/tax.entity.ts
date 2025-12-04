import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Country } from 'src/region/entities/country.entity';

export type TaxDocument = Tax & Document;

@Schema({ timestamps: true })
export class Tax {
  @Prop({ required: true })
  name: string; // Ex: TVA

  @Prop({ required: true })
  rate: number; // Exemple: 18 pour 18%

  @Prop({ type: Types.ObjectId, ref: Country.name, required: true })
  country: Types.ObjectId; // Taxe liée à un pays spécifique


}

export const TaxSchema = SchemaFactory.createForClass(Tax);
