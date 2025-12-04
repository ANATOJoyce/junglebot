import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { RegisterDto } from './dto/registerCustomer.dto';
import { CreateCustomerGroupCustomerDto, UpdateCustomerGroupCustomerDto } from './dto/customer-group-customer.dto';
import { CreateCustomerGroupDto, UpdateCustomerGroupDto } from './dto/customer-group.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // -----------------------------
  // CUSTOMER
  // -----------------------------
  @Post()
  create(@Body() dto: RegisterDto) {
    return this.customerService.register(dto);
  }

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }
/*
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(+id, dto);
  }
*/
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }

  // -----------------------------
  // CUSTOMER GROUP
  // -----------------------------
  @Post('store/:storeId/group')
  createGroup(@Param('storeId') storeId: string, @Body() dto: CreateCustomerGroupDto) {
    return this.customerService.createGroup(dto, storeId);
  }

  @Get('store/:storeId/group')
  findAllGroups(@Param('storeId') storeId: string) {
    return this.customerService.findAllGroups(storeId);
  }

  @Get('store/:storeId/group/:id')
  findGroup(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.findGroup(id, storeId);
  }

  @Patch('store/:storeId/group/:id')
  updateGroup(@Param('storeId') storeId: string, @Param('id') id: string, @Body() dto: UpdateCustomerGroupDto) {
    return this.customerService.updateGroup(id, storeId, dto);
  }

  @Delete('store/:storeId/group/:id')
  removeGroup(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.removeGroup(id, storeId);
  }

  // -----------------------------
  // CUSTOMER GROUP CUSTOMER
  // -----------------------------
  @Post('store/:storeId/group-customer')
  createGroupCustomer(@Param('storeId') storeId: string, @Body() dto: CreateCustomerGroupCustomerDto) {
    return this.customerService.createGroupCustomer(dto, storeId);
  }

  @Get('store/:storeId/group-customer')
  findAllGroupCustomers(@Param('storeId') storeId: string) {
    return this.customerService.findAllGroupCustomers(storeId);
  }

  @Get('store/:storeId/group-customer/:id')
  findGroupCustomer(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.findGroupCustomer(id, storeId);
  }

  @Patch('store/:storeId/group-customer/:id')
  updateGroupCustomer(@Param('storeId') storeId: string, @Param('id') id: string, @Body() dto: UpdateCustomerGroupCustomerDto) {
    return this.customerService.updateGroupCustomer(id, storeId, dto);
  }

  @Delete('store/:storeId/group-customer/:id')
  removeGroupCustomer(@Param('storeId') storeId: string, @Param('id') id: string) {
    return this.customerService.removeGroupCustomer(id, storeId);
  }

  
  @Get()
  async getAllCustomers() {
    return this.customerService.findAllWithDetails()
  }


   @Get()
  async getCustomers(
    @Param('storeId') storeId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.customerService.findAllByStore(storeId, pageNumber, limitNumber);
  }
}