import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/user/entities/user.entity';


export enum CustomerStatus {
  NOUVEAU = 'NOUVEAU',
  VIP = 'VIP',

}

@Schema()
export class Customer extends User {
  @Prop()
  name?: string;

  @Prop({ required: true, enum: CustomerStatus, default: CustomerStatus.NOUVEAU })
  status: string; // VIP OU NOUVEAU

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export type CustomerDocument = Customer & Document;
export const CustomerSchema = SchemaFactory.createForClass(Customer);

