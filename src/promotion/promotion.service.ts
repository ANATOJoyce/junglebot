import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Promotion, PromotionDocument } from './entities/promotion.entity';
import { PromotionAmount, PromotionAmountDocument } from './entities/promotion-amount.entity';
import { PromotionBuyXGetY, PromotionBuyXGetYDocument } from './entities/promotion-buyxgety.entity';

import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionType } from './entities/promotion-type.enum';
import { PromotionMethod } from './promotion-methode.enum';
import { PromotionStatus } from './enum-promotion';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreatePromotionConditionDto } from './dto/create-promotion-condition.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionCondition, PromotionConditionDocument } from './entities/promotion-condition.entity';

@Injectable()
export class PromotionService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Promotion.name) private promotionModel: Model<PromotionDocument>,
    @InjectModel(PromotionAmount.name) private promotionAmountModel: Model<PromotionAmountDocument>,
    @InjectModel(PromotionBuyXGetY.name) private promotionBuyXGetYModel: Model<PromotionBuyXGetYDocument>,
    @InjectModel(PromotionCondition.name) private promotionConditionModel: Model<PromotionConditionDocument>,
  ) {}

  // ---------------- CREATE ---------------- //

  async createPromotion(
    dto: CreatePromotionDto,
    storeId: string,
  ): Promise<Promotion> {
    try {
      //  Vérifie si un code promotion existe déjà
      if (dto.code) {
        const existingPromo = await this.promotionModel.findOne({ code: dto.code });
        if (existingPromo) {
          throw new BadRequestException(
            `Le code promotion "${dto.code}" existe déjà. Veuillez en choisir un autre.`,
          );
        }
      }

      //  Création du document
      const promotion = new this.promotionModel({
        type: dto.type,
        method: dto.method,
        code: dto.code,
        Promotion_value: dto.Promotion_value,
        taxe_include: dto.taxe_include,
        condition: dto.condition,
        operateur: dto.operateur,
        value: dto.value,
        discount: dto.discount,
        Max_quantity: dto.Max_quantity,
        Min_quantity: dto.Min_quantity,
        campaign: dto.campaign ? new Types.ObjectId(dto.campaign) : undefined,
        store: new Types.ObjectId(storeId),
        status: dto.status || PromotionStatus.DRAFT,
        startDate: dto.startDate,
        endDate:dto.endDate
      });

      return await promotion.save();
    } catch (error) {
      //  Gestion d’erreur MongoDB (clé dupliquée)
      if (error.code === 11000 && error.keyPattern?.code) {
        throw new BadRequestException(
          `Le code promotion "${error.keyValue.code}" existe déjà. Veuillez en choisir un autre.`,
        );
      }

      throw new BadRequestException(
        `Erreur lors de la création de la promotion : ${error.message}`,
      );
    }
  }

// promotion.service.ts
async findById(id: string): Promise<Promotion> {
  try {
    const promotion = await this.promotionModel
      .findById(id)
      .exec();

    if (!promotion) {
      throw new BadRequestException('Promotion introuvable.');
    }

    return promotion;
  } catch (error) {
    throw new BadRequestException(
      `Erreur lors de la récupération de la promotion : ${error.message}`,
    );
  }
}



async getAmountOffProductPromotions(storeId: string) {
  return this.promotionModel.find({
    store: new Types.ObjectId(storeId), // 👈 conversion obligatoire
    type: PromotionType.AMOUNT_OFF_PRODUCT,
  });
}

async updateStatus(
  id: string,
  status: PromotionStatus,
  startDate?: Date,
  endDate?: Date,
): Promise<Promotion> {
  const promo = await this.promotionModel.findById(id);
  if (!promo) throw new BadRequestException('Promotion introuvable.');

  const today = new Date();

  // Mise à jour des dates si fournies
  if (startDate) promo.startDate = startDate;
  if (endDate) promo.endDate = endDate;

  // Vérifie la date de fin pour forcer le statut
  if (promo.endDate && promo.endDate < today) {
    promo.status = PromotionStatus.EXPIRED;
  } else {
    promo.status = status;
  }

  return promo.save();
}





  // ---------------- READ ---------------- //

  async findAllByStore(storeId: string): Promise<Promotion[]> {
    return this.promotionModel
      .find({ store: new Types.ObjectId(storeId) })
      .populate('condition')
      .exec();
  }

  async findOneById(id: string, storeId: string): Promise<Promotion> {
    const promotion = await this.promotionModel
      .findOne({ _id: id, store: new Types.ObjectId(storeId) })
      .populate('condition')
      .exec();

    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} introuvable pour cette boutique`);
    }
    return promotion;
  }

  // ---------------- UPDATE ---------------- //

  async update(id: string, dto: UpdatePromotionDto, storeId: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findOneAndUpdate(
      { _id: id, store: new Types.ObjectId(storeId) },
      { $set: dto },
      { new: true },
    );

    if (!promotion) {
      throw new NotFoundException(`Promotion ${id} introuvable ou non autorisée`);
    }
    return promotion;
  }

  // ---------------- DELETE ---------------- //

  async remove(id: string, storeId: string): Promise<{ message: string }> {
    const result = await this.promotionModel.deleteOne({ _id: id, store: new Types.ObjectId(storeId) });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Promotion ${id} introuvable ou non autorisée`);
    }

    return { message: 'Promotion supprimée avec succès' };
  }
 
  //---------------PROMOTION_CONDITION---------//

    async createPromotionCondition(dto: CreatePromotionConditionDto) {
    const condition = new this.promotionConditionModel(dto);
    return condition.save();
  }

  async getAllPromotionConditions() {
  return this.promotionConditionModel.find().lean();
}

}
