import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrdersService } from './order.service';
import { Order } from './entities/CommandePrincipale/order.entity';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreGuard } from 'src/auth/StoreAuthGuard';
import { Role } from 'src/auth/role.enum';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}


  @UseGuards(JwtAuthGuard, StoreGuard)
  @Roles(Role.ADMIN, Role.VENDOR)
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
  return { order }; // <-- wrap dans un objet
}


  @Put(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Order> {
    return this.ordersService.remove(id);
  }
}
