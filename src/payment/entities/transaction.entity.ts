// src/transactions/schemas/transaction.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentCollection } from './payment-collection.entity'; // Si nécessaire
import { PaymentSession } from './payment-session.entity'; // Si nécessaire
import { Refund } from './refund.entity'; // Si nécessaire
import { Capture } from './capture.entity'; // Si nécessaire

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: String, required: true, unique: true })
  identifier: string; // Identifiant unique de la transaction

  @Prop({ type: Types.Decimal128, required: true })
  amount: number; // Montant de la transaction

  @Prop({ type: String, required: true })
  phone_number: string; // Numéro de téléphone du client

  @Prop({ type: String, required: true })
  network: string; // Réseau du client (FLOOZ, TMONEY)

  @Prop({ enum: ['pending', 'success', 'failed'], default: 'pending' })
  status: string; // Statut de la transaction

  @Prop({ type: String, default: '' })
  payment_reference: string; // Référence du paiement (par exemple, ID transaction dans le système externe)

  @Prop({ enum: ['FLOOZ', 'T-Money'], required: true })
  payment_method: string; // Méthode de paiement (FLOOZ, T-Money)

  @Prop({ type: Date, default: Date.now })
  createdAt: Date; // Date de création de la transaction

  // Relations (facultatif)
  @Prop({ type: Types.ObjectId, ref: 'PaymentCollection', default: null })
  payment_collection?: PaymentCollection | null;

  @Prop({ type: Types.ObjectId, ref: 'PaymentSession', default: null })
  payment_session?: PaymentSession | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Refund' }], default: [] })
  refunds: Refund[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Capture' }], default: [] })
  captures: Capture[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
