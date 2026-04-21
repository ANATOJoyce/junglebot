import { Module, forwardRef } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { Customer, CustomerSchema } from './entities/customer.entity';
import { CustomerGroup, CustomerGroupSchema } from './entities/customer-group.entity';
import { CustomerGroupCustomer, CustomerGroupCustomerSchema } from './entities/customer-group-customer.entity';
import { Order, OrderSchema } from 'src/order/entities/CommandePrincipale/order.entity';
import { VerificationCode, VerificationCodeSchema } from 'src/verification/entities/verification-code.entity';

import { MailModule } from 'src/mail/mail.module';
import { VerificationCodeModule } from 'src/verification/verification-code.module';
import { OrderModule } from 'src/order/order.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: CustomerGroup.name, schema: CustomerGroupSchema },
      { name: CustomerGroupCustomer.name, schema: CustomerGroupCustomerSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
    ]),

    forwardRef(() => OrderModule), // ✅ important
    MailModule,
    VerificationCodeModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
