import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './order.service';
import { Order } from './entities/CommandePrincipale/order.entity';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreGuard } from 'src/auth/StoreAuthGuard';
import { Role } from 'src/auth/role.enum';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { NotificationService } from 'src/notification/notification.service';
import { CustomerService } from 'src/customer/customer.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService,
              private readonly notificationService: NotificationService,
              private readonly customerService: CustomerService
  ) {}


  @Post('create')
  async createOrder(
    @Body('customerId') customerId: string,
    @Body('sessionId') sessionId: string
  ) {
    return this.ordersService.createOrder(customerId, sessionId);
  }

  @UseGuards(JwtAuthGuard, StoreGuard)
 @Get('store/:storeId/stats')
  async getStoreStats(
    @Param('storeId') storeId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getStoreStats(storeId, {  status, startDate, endDate });
  }



@UseGuards(JwtAuthGuard,StoreGuard)
@Roles(Role.ADMIN, Role.VENDOR)
@Get('store/:storeId')
async getOrdersByStore(
  @Req() req,
  @Query('page') page: string,
  @Query('limit') limit: string,
  @Query('search') search: string,
  @Query('status') status: string,
  @Query('startDate') startDate: string,
  @Query('endDate') endDate: string
) {
  const storeId = req.user.storeId; // depuis JWT
  return this.ordersService.getOrdersByStore(storeId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    status,
    startDate,
    endDate
  });
}


 @UseGuards(JwtAuthGuard, StoreGuard)
  @Get(':orderId')
  async getOrderById(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }


  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    const updated = await this.ordersService.updateOrderStatus(id, dto.status);
    return { order: updated };
  }

  @UseGuards(JwtAuthGuard, StoreGuard)
  @Get('store/:storeId/customers')
  async getCustomersByStore(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('type') type?: string,
  ) {
    return this.ordersService.getCustomersByStore(storeId, {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      type,
    });
  }

 @Get('customer/:customerId')
getOrdersByCustomer(@Param('customerId') customerId: string) {
  return this.ordersService.getOrdersByCustomer(customerId);
}

  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }






  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Order> {
    return this.ordersService.remove(id);
  }

  


/*
  @Patch(':id/notify')
async notifyCustomer(@Param('id') id: string) {
  const order = await this.ordersService.findOne(id);
  if (!order) throw new Error('Commande introuvable');

  // Logic to send notification or email to customer
  await this.notificationService.sendEmail(order.customer_id?.phone, 'Notification de la commande', 'Votre commande a été annulée.');

  return { message: 'Notification envoyée au client' };
}*/



}
