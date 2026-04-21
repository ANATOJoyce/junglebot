import { Controller, Post, Get, Param, Patch, Delete, Body, Query, NotFoundException, ValidationPipe, UnauthorizedException, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { Customer } from './entities/customer.entity';
import { AuthenticateCustomerDto } from './dto/authenticate-customer.dto';
import { OrdersService } from 'src/order/order.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StoreGuard } from 'src/auth/StoreAuthGuard';
import { StoreService } from 'src/store/store.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService,
    private readonly orderService: OrdersService,
  ) {}

  @Post('create')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.createCustomer(createCustomerDto);
  }

   @Get('with-orders')
async getCustomersWithOrders() {
  return this.customerService.findCustomersWithOrders();
}
  @Post('resend-code')
resendCode(@Body() body: { email: string }) {
  return this.customerService.resendVerificationCode(body.email);
}
@Post('verify-code')
@HttpCode(HttpStatus.OK)
async verifyCode(
  @Body() body: { email: string; code: string }
) {
  return {
    success: true,
    ...(await this.customerService.verifyAccountCode(body.email, body.code)),
  };
}
@Post('authenticate')
@HttpCode(HttpStatus.OK)
async authenticate(
  @Body() authenticateDto: AuthenticateCustomerDto,
) {
  const { email, password } = authenticateDto;

  const customer = await this.customerService.authenticate(email, password);

  if (!customer) {
    throw new UnauthorizedException('Email ou mot de passe incorrect');
  }

  return {
    success: true,
    ...customer,
  };
}
  @Get()
  async findByEmail(@Query(new ValidationPipe({ transform: true })) query: CheckEmailDto): Promise<Customer> {
    const { email } = query;

    const customer = await this.customerService.findByEmail(email);
    if (!customer) throw new NotFoundException('Client introuvable');

    return customer;
  }

  @Get()
  async getAllCustomers() {
    return this.customerService.getAllCustomers();
  }
  
@Get(':id/orders')
getCustomerOrders(@Param('id') id: string) {
  return this.customerService.getCustomerWithOrders(id);
}

  @Get(':id')
  async getCustomerById(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }



  @Patch(':id')
  async updateCustomer(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.updateCustomer(id, updateCustomerDto);
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }

    @Get(':customerId/orders')
  @HttpCode(HttpStatus.OK)
  async getOrdersByCustomer(@Param('customerId') customerId: string) {
    return this.orderService.findByCustomer(customerId);
  }
  @Patch(':customerId/status')
  async updateCustomerStatus(
    @Param('customerId') customerId: string,
    @Body('status') status: string,
  ) {
    return this.orderService.updateCustomerStatus(customerId, status);
  }



}
