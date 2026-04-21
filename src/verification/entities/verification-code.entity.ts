import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';


export enum VerificationType {
  ACCOUNT = 'account',
  STORE = 'store',
}

@Schema({ timestamps: true })
export class VerificationCode extends Document {
    
  @Prop({ required: true })
  email: string;  // on stocke directement l'email du Customer

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: VerificationType })
  type: VerificationType;

  @Prop({  expires: 60 })
  expiresAt: Date;
}
export type VerificationCodeDocument = VerificationCode & Document;

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);
