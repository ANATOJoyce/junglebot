import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthIdentity, AuthIdentitySchema } from './entities/auth-identity.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { RolesGuard } from './roles.guards';
import { JwtAuthGuard } from './jwt-auth.guard';
import { VerificationCode, VerificationCodeSchema } from './entities/verification-code.entity';
import { MailModule } from '../mail/mail.module';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategie';
import { OtpModule } from 'src/otp/otp.module';
import { ProviderIdentity, ProviderIdentitySchema } from './entities/provider-identity.entity';
import { LocalStrategy } from './local.strategy';
import { Otp, OtpSchema } from 'src/otp/otp.entity';
import { VerificationCodeModule } from 'src/verification/verification-code.module';


@Module({
  imports: [
    ConfigModule, 
    PassportModule,
    UserModule,
    MailModule,
    OtpModule,
        VerificationCodeModule, // ← Important !

    // pour être sûr que ConfigService est dispo
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '3600s' }, // tu peux aussi récupérer ça depuis la config
      }),
    }), 
    OtpModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthIdentity.name, schema: AuthIdentitySchema },
      { name: ProviderIdentity.name, schema: ProviderIdentitySchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: Otp.name, schema: OtpSchema }
      
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, LocalStrategy],
  exports: [AuthService,PassportModule,JwtStrategy, JwtAuthGuard]

})
export class AuthModule {}
