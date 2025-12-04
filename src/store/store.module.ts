import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './entities/store.entity';
import { Currency, CurrencySchema } from 'src/currency/entities/currency.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { MailModule } from 'src/mail/mail.module';
import { Country, CountrySchema } from 'src/region/entities/country.entity';
import { VerificationCodeModule } from 'src/verification/verification-code.module';
import { UserModule } from 'src/user/user.module';

@Module({

  imports: [
    AuthModule,
    MailModule,
    UserModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Store.name, schema: StoreSchema },
      { name: Country.name, schema: CountrySchema },
      { name: Currency.name, schema: CurrencySchema },
      { name: User.name, schema: UserSchema }, 
      
    ]),
    VerificationCodeModule, 
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [MongooseModule,StoreService], 
})
export class StoreModule {}
