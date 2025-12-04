import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { Store, StoreSchema } from 'src/store/entities/store.entity';
import { AuthIdentity, AuthIdentitySchema } from 'src/auth/entities/auth-identity.entity';
import { Invite, InviteSchema } from './entities/invite.entiy';
import { Customer, CustomerSchema } from 'src/customer/entities/customer.entity';
import { Manager, ManagerSchema } from 'src/manager/manager.entity';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: Store.name, schema: StoreSchema },
      { name: AuthIdentity.name, schema: AuthIdentitySchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Manager.name, schema: ManagerSchema }, // 
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
