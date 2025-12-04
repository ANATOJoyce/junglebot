import { Body, Controller, Get, Param, Patch, Post, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Types } from 'mongoose';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Créer un nouveau panier
  @Post()
  async create(@Body() createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

  // Récupérer tous les paniers
  @Get()
  async findAll() {
    return this.cartService.findAll();
  }

  // Récupérer un panier par ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  // Mettre à jour l'ordre lié à un panier
  @Patch(':cartId/order')
  async updateOrder(@Param('cartId') cartId: string, @Body('orderId') orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Invalid order ID');
    }
    return this.cartService.updateOrder(cartId, new Types.ObjectId(orderId));
  }
}
