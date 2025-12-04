import { PartialType } from '@nestjs/mapped-types';
import { CreatePromotionConditionDto } from './create-promotion-condition.dto';

export class UpdatePromotionConditionDto extends PartialType(CreatePromotionConditionDto) {}
