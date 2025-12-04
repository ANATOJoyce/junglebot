import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionGetRuleDto } from './create-promotion-get-rule.dto';

export class UpdatePromotionGetRuleDto extends PartialType(CreatePromotionGetRuleDto) {}
