import { Module } from '@nestjs/common';
import { VerificationCodeService } from './verification-code.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationCode, VerificationCodeSchema } from './entities/verification-code.entity';
import { MailModule } from 'src/mail/mail.module';
import { UserModule } from 'src/user/user.module';
import { User, UserSchema } from 'src/user/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationCode.name, schema: VerificationCodeSchema },
       { name: User.name, schema: UserSchema },
    ]),
     MailModule,
     UserModule
  ],
  providers: [VerificationCodeService],
  exports: [VerificationCodeService], //  Important pour pouvoir l’utiliser ailleurs
})
export class VerificationCodeModule {}
