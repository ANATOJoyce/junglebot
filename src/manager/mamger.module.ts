import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { Manager, ManagerSchema } from './manager.entity';
import { Otp, OtpSchema } from 'src/otp/otp.entity';
import { OtpModule } from 'src/otp/otp.module';
import { JwtModule } from '@nestjs/jwt'; // <-- Import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    OtpModule,
    JwtModule.register({}), // <-- On peut passer une config vide si on n’a pas besoin ici de secret
  ],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
