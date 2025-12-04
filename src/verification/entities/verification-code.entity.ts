import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';


export enum VerificationType {
  ACCOUNT = 'account',
  STORE = 'store',
}

@Schema({ timestamps: true })
export class VerificationCode extends Document {
    
 @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
 user?: User;


  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: VerificationType })
  type: VerificationType;

  @Prop({ required: true })
  expiresAt: Date;
}
export type VerificationCodeDocument = VerificationCode & Document;

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);
