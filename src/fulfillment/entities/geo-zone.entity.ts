import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceZone } from './service-zone.entity';

export enum GeoZoneType {
  COUNTRY = 'country',
  PROVINCE = 'province',
  CITY = 'city',
  ZIP = 'zip'
}

export type GeoZoneDocument = GeoZone & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret:{ _id?: any; __v?: number; id?: string; password?: string; }) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})

export class GeoZone {
  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () => `fgz_${new Types.ObjectId().toString()}`,
  })
  id: string;

  @Prop({
    type: String,
    enum: GeoZoneType,
    default: GeoZoneType.COUNTRY
  })
  type: GeoZoneType;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: String, default: null })
  province_code: string | null;

  @Prop({ type: String, default: null })
  city: string | null;

  @Prop({ type: Object, default: null })
  postal_expression: Record<string, unknown> | null;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'ServiceZone',
    required: true
  })
  service_zone: Types.ObjectId | ServiceZone;

  @Prop({ type: Object, default: null })
  metadata: Record<string, unknown> | null;

  @Prop({ type: Date, default: null })
  deleted_at: Date | null;

  // Virtual for populated service zone
  public service_zone_details?: ServiceZone;
}

export const GeoZoneSchema = SchemaFactory.createForClass(GeoZone);
