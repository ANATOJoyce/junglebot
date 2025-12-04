import { Controller, Get, Param,  HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /stats/customers/:storeId
   * Récupère les statistiques clients pour une boutique donnée
   */

    @UseGuards(JwtAuthGuard)
  @Get('customers/:storeId')
  async getCustomerStats(@Param('storeId') storeId: string) {
    try {
      const stats = await this.statsService.getCustomerStats(storeId);
      return { success: true, data: stats };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        { success: false, message: 'Impossible de récupérer les statistiques clients.' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:storeId')
  async getOrdersByStore(@Param('storeId') storeId: string) {
    const orders = await this.statsService.getAllOrdersByStore(storeId);
    return { data: orders };
  }

    @UseGuards(JwtAuthGuard)
  @Get('products/:storeId')
  getProductStats(@Param('storeId') storeId: string) {
    return this.statsService.getProductStats(storeId);
  }

/*
  
  @UseGuards(JwtAuthGuard)
  @Get('products/:storeId')
  async getProductsByStore(@Param('storeId') storeId: string) {
    const products = await this.statsService.getAllProductsByStore(storeId);
    return { data: products };
  }
    */
}
 