import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; // Add this import
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { Promotion, PromotionSchema } from './entities/promotion.entity';
import { PromotionCondition, PromotionConditionSchema } from './entities/promotion-condition.entity';
import { PromotionAmount, PromotionAmountSchema } from './entities/promotion-amount.entity';
import { PromotionBuyXGetY, PromotionBuyXGetYSchema } from './entities/promotion-buyxgety.entity';
import { StoreGuard } from 'src/auth/StoreAuthGuard';
import { StoreService } from 'src/store/store.service';
import { StoreModule } from 'src/store/store.module';
import { MailModule } from 'src/mail/mail.module';
import { VerificationCodeModule } from 'src/verification/verification-code.module';

@Module({
  imports: [
    StoreModule,
    MailModule,
    VerificationCodeModule,
    JwtModule.register({ secret: 'your-secret-key', signOptions: { expiresIn: '60m' } }), // Register JwtModule here
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      { name: PromotionCondition.name, schema: PromotionConditionSchema },
      { name: PromotionAmount.name, schema: PromotionAmountSchema },
      { name: PromotionBuyXGetY.name, schema: PromotionBuyXGetYSchema },
    ]),
  ],
  controllers: [PromotionController],
  providers: [PromotionService, StoreGuard, StoreService],
  exports: [PromotionService],
})
export class PromotionModule {}
