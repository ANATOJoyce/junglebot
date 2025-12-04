// src/transactions/dto/transaction.dto.ts

import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  identifier: string;  // Identifiant unique de la transaction

  @IsNumber()
  amount: number;  // Montant de la transaction

  @IsString()
  phone_number: string;  // Numéro de téléphone du client

  @IsString()
  network: string;  // Réseau du client (FLOOZ, TMONEY)

  @IsEnum(['FLOOZ', 'T-Money'])
  payment_method: string;  // Méthode de paiement

  @IsOptional()
  @IsString()
  payment_reference?: string;  // Référence de paiement (si disponible)
}

export class UpdateTransactionStatusDto {
  @IsEnum(['pending', 'success', 'failed'])
  status: string;  // Nouveau statut de la transaction
}
