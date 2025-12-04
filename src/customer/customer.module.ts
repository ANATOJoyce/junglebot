import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './entities/customer.entity';
import { JwtModule } from '@nestjs/jwt';
import { CustomerGroup, CustomerGroupSchema } from './entities/customer-group.entity';
import { CustomerGroupCustomer, CustomerGroupCustomerSchema } from './entities/customer-group-customer.entity';
import { Order, OrderSchema } from 'src/order/entities/CommandePrincipale/order.entity';

@Module({

    imports: [
      CustomerModule,
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Order.name, schema: OrderSchema },
      { name: CustomerGroup.name, schema: CustomerGroupSchema },
      { name: CustomerGroupCustomer.name, schema: CustomerGroupCustomerSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret', // clé secrète
      signOptions: { expiresIn: '1d' }, // expiration du token
    }),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
   exports: [CustomerService],
})
export class CustomerModule {}
