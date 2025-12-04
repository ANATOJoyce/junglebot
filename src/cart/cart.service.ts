import { BadRequestException, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { LineItemAdjustment, LineItemAdjustmentDocument } from "./entities/line-item-adjustment.entity";
import { Connection, isValidObjectId, Model, SortOrder, Types, Document } from "mongoose";
import {  CreateCartDto } from "./dto/create-cart.dto";
import { Cart, CartDocument, CartStatus } from "./entities/cart.entity";


export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,  // ← Ajoute cette ligne
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>

  
  ) {}

async create(createCartDto: CreateCartDto): Promise<Cart> {
  const productIds = createCartDto.items.map(i => i.product);
  const products = await this.connection
    .collection('products')
    .find({ _id: { $in: productIds.map(id => new Types.ObjectId(id)) } })
    .toArray();

  let total = 0;
  const items = createCartDto.items.map(i => {
    const product = products.find(p => p._id.toString() === i.product);
    if (!product) throw new BadRequestException(`Produit introuvable: ${i.product}`);
    const quantity = i.quantity || 1;
    total += product.price * quantity;
    return { product: i.product, quantity };
  });

  const cart = new this.cartModel({ ...createCartDto, items, total });
  return cart.save();
}



  async findAll(): Promise<Cart[]> {
    return this.cartModel.find().populate('customer').populate('items.product').exec();
  }

  async findOne(id: string): Promise<Cart> {
    const cart = await this.cartModel.findById(id).populate('customer').populate('items.product').exec();
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async updateOrder(cartId: string, orderId: Types.ObjectId): Promise<Cart> {
    const cart = await this.cartModel.findById(cartId);
    if (!cart) throw new NotFoundException('Cart not found');
    cart.order = orderId;
    cart.status = CartStatus.ORDERED;
    return cart.save();
  }

}