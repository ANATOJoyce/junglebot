import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { StoreStatus } from '../update-store-status.dto';
import { Country } from 'src/region/entities/country.entity';

@Schema({
  timestamps: true,

})


export class Store extends Document {
  @Prop({ required: true, index: true, unique: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Country' })
  country: Country;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;

  @Prop({ required: true, index: true, unique: true })
  supported_currencies?: String;
  
  // ici se sera automatiquement le currendy du pays choisie

  @Prop({ type: String, enum: StoreStatus, default: StoreStatus.INACTIVE })
  status: StoreStatus;

}

export type StoreDocument = Store & Document;
export const StoreSchema = SchemaFactory.createForClass(Store);