import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Country } from './country.entity';

export type RegionDocument = Region & Document;

@Schema({
  timestamps: true,
 
})
export class Region {
  @Prop({ required: true, index: true })
  name: string;

 

}

export const RegionSchema = SchemaFactory.createForClass(Region);
