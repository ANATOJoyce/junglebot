import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, NotFoundException, Req, Put, Query, Request } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/role.enum';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guards';
import { CreateStoreWithUserDto } from './dto/create-store-with-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UpdateCurrencyDto } from 'src/currency/dto/update-currency.dto';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  
  @Post('create-shop')
  async create(@Body() dto: CreateStoreDto & { owner: string }) {
    console.log(dto, 'dto')
    return this.storeService.createStoreForExistingUser(dto, dto.owner);
  }


 
 // store.controller.ts
  @Put(':id')
  async updateStore(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.updateStore(id, updateStoreDto);
  }



  @Get('my-stores')
  findAll(@Query() query: any) {
    return this.storeService.findAll(query);
  }


  /*@UseGuards(AuthGuard('jwt'), RolesGuard)*/
  @Roles(Role.VENDOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('me')
  //async getMyStore(){
  async getMyStore(@Request() req) {
    const userId = req.user.id
    console.log('USER ID from token:', userId); // pour debug
    //return {}
    if (!userId) {
      throw new NotFoundException('Utilisateur non authentifié.');
    }

    const store = await this.storeService.findStoreByUserId(userId);
    if (!store) {
      throw new NotFoundException('Aucune boutique trouvée pour ce vendeur.');
    }

    return store;
  }

//  @UseGuards(AuthGuard('jwt'), RolesGuard)
//  @Roles(Role.ADMIN)
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.storeService.activateStore(id);
  }


   /*@UseGuards(AuthGuard('jwt'), RolesGuard)*/
  @Roles(Role.VENDOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('my')
  //async getMyStore(){
  async getMyStores(@Request() req) {
    const userId = req.user.id
    console.log('USER ID from token:', userId); // pour debug
    //return {}
    if (!userId) {
      throw new NotFoundException('Utilisateur non authentifié.');
  }

    const store = await this.storeService.getMyStores(userId);
    if (!store) {
      throw new NotFoundException('Aucune boutique trouvée pour ce vendeur.');
    }
    const premierStore = store[0]
    console.log(premierStore)
    return store;
  }


  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const store = await this.storeService.findOne(id); // OK : pas besoin de user
    if (!store) throw new NotFoundException(`Boutique avec ID ${id} non trouvée`);
    return store;
  }

  @Patch(':id')
  @Roles(Role.VENDOR, Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(id, updateStoreDto);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeService.remove(id);
  }
  
  //currency 

  @Post('currency')
  createCurrency(@Body() dto: CreateCurrencyDto) {
    return this.storeService.createCurrency(dto);
  }

  @Get('currency')
  findAllCurrencies() {
    return this.storeService.findAllCurrencies();
  }

  @Get('currency/:id')
  findOneCurrency(@Param('id') id: string) {
    return this.storeService.findOneCurrency(id);
  }

  @Patch('currency/:id')
  updateCurrency(@Param('id') id: string, @Body() dto: UpdateCurrencyDto) {
    return this.storeService.updateCurrency(id, dto);
  }

  @Delete('currency/:id')
  removeCurrency(@Param('id') id: string) {
    return this.storeService.removeCurrency(id);
  }
  
}