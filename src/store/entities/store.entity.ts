import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { StoreStatus } from '../update-store-status.dto';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
transform: (
  doc,
  ret: { _id: any; __v: number; id?: string }
) => {
  ret.id = `${doc._id.toString()}`;
  delete (ret as any)._id;
  delete (ret as any).__v;
  return ret;
}

  },
  collection: 'stores',
})


export class Store extends Document {
declare _id: Types.ObjectId;
  @Prop({ required: true, index: true, unique: true })
  name: string;

  @Prop({ type: String, default: null })
  default_sales_channel_id?: string;

  @Prop({ type: String, default: null })
  default_region_id?: string;

  @Prop({ type: String, default: null })
  default_location_id?: string;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, unknown>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: User;


  
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'StoreCurrency' }],
    default: [],
  })
  supported_currencies?: MongooseSchema.Types.ObjectId[];


  @Prop({ type: String, enum: StoreStatus, default: StoreStatus.INACTIVE })
  status: StoreStatus;
}

export type StoreDocument = Store & Document;
export const StoreSchema = SchemaFactory.createForClass(Store);