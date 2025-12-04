import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

export type ManagerDocument = Manager & Document;

export enum ManagerStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  RETIRED = 'RETIRED',
}

@Schema()
export class Manager extends User {
  // IDs des boutiques que le manager gère
  @Prop({ default: [] })
  managedStores: string[];

@Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId;

  // Status du manager avec enum
  @Prop({ 
    type: String, 
    enum: ManagerStatus, 
    default: ManagerStatus.ACTIVE 
  })
  status: ManagerStatus;
}

export const ManagerSchema = SchemaFactory.createForClass(Manager);
