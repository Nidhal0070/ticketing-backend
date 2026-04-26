import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'open' })
  status: string; // open, in_progress, resolved, closed

  @Prop({ default: 'medium' })
  priority: string; // low, medium, high

  @Prop({ required: true })
  userId: string;

  @Prop({ default: 'other' })
  category: string; // bug, auth, performance, other

  @Prop({ default: '' })
  suggestedReply: string; // AI suggestion

  @Prop({ default: '' })
  aiSummary: string; // AI summary

  @Prop({ default: false })
  analyzed: boolean; // AI analysis status

  // ✅ NOUVEAU: champ pour savoir d'où vient le ticket
  @Prop({ default: 'web' })
  source: string; // 'web', 'mobile', 'api', 'email'

  
  @Prop({ default: false })
  needsAdmin: boolean;  // ✅ IA demande l'intervention d'un admin

  @Prop({ default: '' })
  escalationReason: string; // Raison pour laquelle l'IA demande l'admin

  // ✅ Timestamps automatiques
  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);