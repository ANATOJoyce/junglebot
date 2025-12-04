import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuthIdentityDocument = AuthIdentity & Document;

@Schema({ timestamps: true })
export class AuthIdentity {
  @Prop({
    required: true,
    unique: true,
    default: () => `auth_${new Types.ObjectId().toHexString()}`,
  })
  id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true })
  email: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ProviderIdentity' }] })
  providerIdentities: Types.ObjectId[];

  @Prop({ type: Object }) 
  metadata: Record<string, any>;

  @Prop({ type: Date }) 
  deleted_at: Date;

  @Prop({ unique: true, sparse: true })
  phone: string;

  @Prop()
  otpCode?: string;

  @Prop()
  otpExpires?: Date;

  @Prop({ default: false })
  isVerified: boolean;

   @Prop({ type: Object })
  credentials: {
    password?: string;
    googleId?: string;  // Ajouté pour Google
    accessToken?: string;
    refreshToken?: string;
  };

}

export const AuthIdentitySchema = SchemaFactory.createForClass(AuthIdentity);
