import { 
  Controller, Get, Post, Body, Param, Put, Delete, 
  UseGuards, Req, 
  BadRequestException,
  Patch
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreGuard } from 'src/auth/StoreAuthGuard';

import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreatePromotionConditionDto } from './dto/create-promotion-condition.dto';
import { isValidObjectId } from 'mongoose';
import { PromotionType } from './entities/promotion-type.enum';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // ---------------- CREATE ---------------- //


  @UseGuards(JwtAuthGuard, StoreGuard)
@Post('conditions/:storeId')
async createCondition(@Body() dto: CreatePromotionConditionDto) {
  return this.promotionService.createPromotionCondition(dto);
}

  @UseGuards(JwtAuthGuard, StoreGuard)
  @Post(':storeId')
  async createPromotion(
    @Param('storeId') storeId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    try {
    

      return await this.promotionService.createPromotion(dto, storeId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }


@UseGuards(JwtAuthGuard, StoreGuard)
@Get('conditions/:storeId')
async getAllConditions() {
  return this.promotionService.getAllPromotionConditions();
}

  @Get(':storeId')
  async getPromotions(@Param('storeId') storeId: string) {
    return this.promotionService.findAllByStore(storeId);
  }

// promotion.controller.ts
@Get(':storeId/:id')
async getPromotionById(@Param('id') id: string) {
  return this.promotionService.findById(id);
}


@UseGuards(JwtAuthGuard, StoreGuard)
@Patch(':id/status')
async updateStatus(
  @Param('id') id: string,
  @Body('status') status: string,
) {
  return this.promotionService.updateStatus(id, status);
}

  
  /**
   * Crée une promotion de type "Amount" (Order/Product)
   */


  /**
   * Crée une promotion de type "Buy X Get Y"
   */

 

  // ---------------- READ ---------------- //

  /**
   * Récupérer toutes les promotions d’une boutique
   */


@UseGuards(JwtAuthGuard, StoreGuard)
 @Get(':storeId')
async findAll(@Req() req) {
  const storeId = req.user.store;
  return this.promotionService.findAllByStore(storeId);
}

/*

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.promotionService.findOne(id);
  }
  /**
   * Récupérer une promotion par son ID
   */


  // ---------------- UPDATE ---------------- //

  /**
   * Modifier une promotion
   */


  // ---------------- DELETE ---------------- //

  /**
   * Supprimer une promotion
   */
  @UseGuards(JwtAuthGuard, StoreGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const storeId = req.user.store;
    return this.promotionService.remove(id, storeId);
  }



  
}
