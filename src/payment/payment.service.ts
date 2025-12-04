import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentDocument } from './entities/payment.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private configService: ConfigService,
  ) {}

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    const txReference = `INV-${uuidv4()}`;
    const url = this.configService.get<string>('PAYGATE_URL');
    const apiKey = this.configService.get<string>('PAYGATE_API_KEY');

    if (!url || !apiKey) {
      throw new HttpException(
        'PAYGATE_URL or PAYGATE_API_KEY missing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Base: paiement pending
    const payment = new this.paymentModel({
      ...data,
      txReference,
      status: 'pending',
    });

    await payment.save();

    try {
      const response = await axios.post(url, {
        auth_token: apiKey,
        phone_number: data.phoneNumber,
        amount: data.amount,
        description: data.description,
        identifier: txReference,
        network: data.network.toUpperCase(),
      });

      const result = response.data;

      if (result.status === 0) {
        payment.status = 'completed';
        payment.externalReference = result.tx_reference;
      } else {
        payment.status = 'failed';
      }

      await payment.save();

      if (result.status !== 0) {
        throw new HttpException(
          `Paiement échoué (status=${result.status})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return payment;

    } catch (error: any) {
      payment.status = 'failed';
      await payment.save();

      throw new HttpException(
        `Erreur PayGate: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
