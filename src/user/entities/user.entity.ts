// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/auth/role.enum';

@Schema({  timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, required: true })
  role: Role;

  @Prop({ required: false })
  authIdentity: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Store' }] })
  stores?: Types.ObjectId[];


}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);