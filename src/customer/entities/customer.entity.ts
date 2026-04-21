import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, MinLength } from 'class-validator';
import { Document } from 'mongoose';
import { timestamp } from 'rxjs';
import { User } from 'src/user/entities/user.entity';



export enum CustomerStatus {
  NOUVEAU = 'NOUVEAU',
  REGULIER = 'RÉGULIER',
  FIDEL = 'FIDÈLE',
  VIP = 'VIP',
  PREMIUM = 'PREMIUM',
}


@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop()
  name?: string;

  @Prop()
  email?: string;

  @Prop({ required: true, enum: CustomerStatus, default: CustomerStatus.NOUVEAU })
  status: string; // 

  @Prop({ default: false })
  isEmailVerified: boolean;
  
  @Prop()
  password: string;


}

export type CustomerDocument = Customer & Document;
export const CustomerSchema = SchemaFactory.createForClass(Customer);

