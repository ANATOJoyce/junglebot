import { Controller, Post, Body, Param, Delete, Patch, Get, Req,UseGuards, BadRequestException, NotFoundException, Query, Put } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartItemByNameDto } from './dto/update-cart-item-by-name.dto';
import { ProductService } from 'src/product/product.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService,
      private readonly productService: ProductService,
  ) {}

  // Récupérer le panier actif

  @Post('add')
  async addToCart(@Body() addCartItemDto: AddCartItemDto) {
    const { sessionId, product, quantity } = addCartItemDto;

    if (!sessionId) {
      throw new BadRequestException('sessionId manquant');
    }

    return this.cartService.addItem(sessionId, product, quantity);
  }

    @Get('view')
  async viewCart(
    @Query('sessionId') sessionId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const cart = await this.cartService.getActiveCart(sessionId, customerId);
    if (!cart) {
      throw new NotFoundException('Panier introuvable');
    }
    return cart;
  }

  // 🔹 Modifier un item
  @Patch('item')
  async updateCartItem(
    @Body() updateCartItemDto: UpdateCartItemByNameDto,
    @Query('sessionId') sessionId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const cart = await this.cartService.updateCartItemByName(
      updateCartItemDto,
      sessionId,
      customerId,
    );

    if (!cart) throw new NotFoundException('Panier introuvable');

    return cart;
  }

  // 🔹 Supprimer un item
  @Delete('item')
  async removeCartItem(
    @Body() body: { product_id?: string; product_name?: string },
    @Query('sessionId') sessionId?: string,
    @Query('customerId') customerId?: string,
  ) {
    const cart = await this.cartService.removeCartItemByName(
      body,
      sessionId,
      customerId,
    );

    if (!cart) throw new NotFoundException('Panier introuvable');

    return cart;
  }

  
  // 🔹 Supprimer un produit du panier
 
}
