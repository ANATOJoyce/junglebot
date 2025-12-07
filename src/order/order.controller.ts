import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
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


  @UseGuards(JwtAuthGuard, StoreGuard)
  @Post(':storeId')
  async createOrder(
    @Param('storeId') storeId: string,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.ordersService.createOrderInStore(createOrderDto, storeId);
  }


  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN, Role.VENDOR, Role.CUSTOMER)
  @Get('store/:storeId')
  async getOrdersByStore(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return await this.ordersService.findAllByStorePaginated(storeId, pageNumber, limitNumber);
  }


  @Get()
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }


@Get(':id')
async findOne(@Param('id') id: string) {
  const order = await this.ordersService.findOne(id);
  return { order }; 
}


  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Order> {
    return this.ordersService.remove(id);
  }

    @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ) {
    const updated = await this.ordersService.updateStatus(id, dto.status);
    return { order: updated };
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


  @Get('store/:storeId/customers')
  async getCustomersByStore(
    @Param('storeId') storeId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 12,
  ) {
    return this.customerService.findAllByStore(storeId, Number(page), Number(limit));
  }

}
