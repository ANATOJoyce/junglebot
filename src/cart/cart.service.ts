// src/cart/cart.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument, CartStatus } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { Product, ProductDocument } from '../product/entities/product.entity';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateCartItemByNameDto } from './dto/update-cart-item-by-name.dto';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,

    private readonly productService: ProductService
  ) {}

  // Récupérer le panier actif (par sessionId ou customerId)
 async getActiveCart(sessionId?: string, customerId?: string): Promise<Cart> {
  let cart: Cart | null = null;

  if (customerId) {
    cart = await this.cartModel
      .findOne({ customer: customerId, status: CartStatus.ACTIVE })
      .populate({
        path: 'items.product',
        model: 'Product',
        select: 'title price storeId', // les champs dont tu as besoin
      });
  } else if (sessionId) {
    cart = await this.cartModel
      .findOne({ sessionId, status: CartStatus.ACTIVE })
      .populate({
        path: 'items.product',
        model: 'Product',
        select: 'title price storeId',
      });
  }

  if (!cart) {
    cart = new this.cartModel({
      sessionId,
      customer: customerId,
      items: [],
      total: 0,
      status: CartStatus.ACTIVE,
    });
    await cart.save();
  }

  return cart;
}



 // cart.service.ts
// cart.service.ts
// cart.service.ts
async addItem(sessionId: string,productId: string,quantity: number = 1,): Promise<Cart> {
  const cart = await this.getActiveCart(sessionId);

  const productDoc = await this.productModel.findById(productId);
  if (!productDoc) {
    throw new NotFoundException('Produit introuvable');
  }

  const existingItem = cart.items.find(
    item => item.product.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: new Types.ObjectId(productId),
      quantity,
      price: productDoc.price,
    });
  }

  cart.total = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );

  await cart.save();
  return cart;
}




  // Rattacher panier existant à un utilisateur qui vient de créer un compte
async attachCartToCustomer(
  sessionId: string,
  customerId: string
): Promise<Cart> {

  const cart = await this.cartModel.findOne({
    sessionId,
    status: 'active'
  });

  if (!cart) {
    throw new NotFoundException('Panier introuvable');
  }

  const existingCart = await this.cartModel.findOne({
    customer: customerId,
    status: CartStatus.ACTIVE
  });

  if (existingCart) {
    // fusion des paniers (logique à définir)
    existingCart.items.push(...cart.items);
    await existingCart.save();
    await cart.deleteOne();
    return existingCart;
  }

  cart.customer = new Types.ObjectId(customerId);
  cart.sessionId = null;

  await cart.save();
  return cart;
}

  async updateItemQuantity(sessionId?: string, customerId?: string, productId?: string, quantity: number = 1): Promise<Cart> {
  const cart = await this.getActiveCart(sessionId, customerId);

  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) throw new NotFoundException('Produit non trouvé dans le panier');

  if (quantity <= 0) {
    // Supprimer l’item si quantity <= 0
    cart.items = cart.items.filter(i => i.product.toString() !== productId);
  } else {
    item.quantity = quantity;
  }

  // Recalculer le total
  cart.total = cart.items.reduce((sum, i) => sum + i.quantity * i.price, 0);

  await cart.save();
  return cart;
}





 // 🔹 Modifier la quantité d’un produit
  async updateCartItemByName(
    data: UpdateCartItemByNameDto,
    sessionId?: string,
    customerId?: string,
  ): Promise<CartDocument | null> {
    let productId = data.product_id;

    if (!productId && data.product_name) {
      const product = await this.productService.findByName(data.product_name);
      if (!product) throw new NotFoundException(`Produit ${data.product_name} introuvable`);
      productId = product._id.toString();
    }

    if (!productId) throw new BadRequestException('Aucun produit fourni');

    const cart = await this.getActiveCart(sessionId, customerId);
    if (!cart) return null;

    // 🔹 Comparaison string → string
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1)
      throw new NotFoundException(`Produit ${data.product_name || productId} introuvable dans le panier`);

    cart.items[itemIndex].quantity = data.quantity;

    // 🔹 Recalcul du total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await cart.save();
    return cart;
  }

  // 🔹 Supprimer un produit du panier
  async removeCartItemByName(
    body: { product_id?: string; product_name?: string },
    sessionId?: string,
    customerId?: string,
  ): Promise<CartDocument | null> {
    let productId = body.product_id;

    if (!productId && body.product_name) {
      const product = await this.productService.findByName(body.product_name);
      if (!product) throw new NotFoundException(`Produit ${body.product_name} introuvable`);
      productId = product._id.toString();
    }

    if (!productId) throw new BadRequestException('Aucun produit fourni');

    const cart = await this.getActiveCart(sessionId, customerId);
    if (!cart) return null;

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1)
      throw new NotFoundException(`Produit ${body.product_name || productId} introuvable dans le panier`);

    cart.items.splice(itemIndex, 1);

    cart.total = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await cart.save();
    return cart;
  }
}
