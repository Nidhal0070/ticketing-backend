import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' })
  role: string; // 'user' or 'admin'

  @Prop({ default: false })
  isBlocked: boolean; // ✅ Utilisateur bloqué par un admin

  @Prop({ default: null })
  lastLogin: Date; // ✅ Dernière connexion

  // ✅ Timestamps automatiques
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);