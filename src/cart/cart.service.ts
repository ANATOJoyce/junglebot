import { BadRequestException, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { LineItemAdjustment, LineItemAdjustmentDocument } from "./entities/line-item-adjustment.entity";
import { Connection, isValidObjectId, Model, SortOrder, Types, Document } from "mongoose";
import { LineItem, LineItemDocument } from "./entities/line-item.entity";
import { Cart, CartDocument } from "./entities/cart.entity";
import { ShippingMethodAdjustment, ShippingMethodAdjustmentDocument } from "./entities/shipping-method-adjustment.entity";
import { Order, OrderDocument } from "src/order/entities/CommandePrincipale/order.entity";
import { ShippingMethod, ShippingMethodDocument } from "./entities/shipping-method.entity";
import { Address, AddressDocument } from "./entities/address.entity";
import { LineItemTaxLine, LineItemTaxLineDocument } from "./entities/line-item-tax-line.entity";
import {  CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartDto } from "./dto/update-cart.dto";
import { User } from "src/user/entities/user.entity";
import { CreateLineItemDto } from "./dto/create-line-item.dto";
import { Promotion } from "src/promotion/entities/promotion.entity";
import { Customer } from "src/customer/entities/customer.entity";
import { CartDTO } from "./dto/cart.dto";


export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,  // ← Ajoute cette ligne
    @InjectModel(LineItemAdjustment.name) private readonly lineItemAdjustmentModel: Model<LineItemAdjustmentDocument>,
    @InjectModel(LineItem.name) private readonly lineItemModel: Model<LineItemDocument>,
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(ShippingMethodAdjustment.name) private readonly shippingMethodAdjustmentModel: Model<ShippingMethodAdjustmentDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel(LineItemTaxLine.name) private readonly lineItemTaxLineModel: Model<LineItemTaxLineDocument>,
    @InjectModel(ShippingMethod.name) private readonly shippingMethodModel: Model<ShippingMethodDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(ShippingMethodAdjustment.name) private adjustmentModel: Model<ShippingMethodAdjustmentDocument>,
    @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,

  
  ) {}

  async createCart(dto: CreateCartDto): Promise<Cart> {
    const cart = new this.cartModel({
      ...dto,
      items: [],
      credit_lines: [],
      shipping_methods: [],
      subtotal: 0,
      total: 0,
      tax_total: 0,
      discount_total: 0,
      shipping_total: 0,
    });

    return await cart.save();
  }

    // 6. getCart : améliorer le populate pour toutes les relations
  async getCart(cartId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findById(cartId)
      .populate({
        path: 'items',
        populate: ['adjustments', 'tax_lines']
      })
      .populate({
        path: 'shipping_methods',
        populate: ['adjustments', 'tax_lines']
      })
      .populate('shipping_address')
      .populate('billing_address')
      .exec();

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return cart;
  }


  async createCartByCustomer(createCartDto: Partial<CartDTO>, req): Promise<Cart> {
    const { items, ...rest } = createCartDto;

    // Récupération du customerId depuis JWT
    const customerId = req.user?.id;
    if (!customerId) {
      throw new BadRequestException('Identifiant client manquant dans le token');
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Client non trouvé');
    }

    const newCart = new this.cartModel({
      customerId: customer._id,
      items: items || [],
      ...rest,
    });

    return await newCart.save();
  }




  // Optionnel : Méthode pour récupérer tous les paniers d'un client
  async getCartsByCustomerId(customerId: string): Promise<Cart[]> {
    return this.cartModel.find({ customerId }).exec();
  }



    // Ajouter un produit au panier
  async addItemToCart(cartId: string, itemDto: CreateLineItemDto): Promise<Cart> {
    const lineItem = new this.lineItemModel({
      ...itemDto,
      cart: new Types.ObjectId(cartId),
      unit_price: itemDto.unit_price, // valeur directe pour l’instant
    });
    const savedItem = await lineItem.save();

    // Ajout au panier
    await this.cartModel.findByIdAndUpdate(
      cartId,
      { $addToSet: { items: savedItem._id } },
      { new: true }
    );

    // Recalcul des totaux
    return this.calculateCartTotals(cartId);
  }


  
// Ajouter un produit au panier
 async addProductToCart(cartId: string, productData: any): Promise<LineItem> {
  //  Vérification si le panier existe
  const cart = await this.cartModel.findById(cartId);
  if (!cart) {
    throw new BadRequestException(`Le panier avec l'id ${cartId} n'existe pas.`);
  }

  //  Création du LineItem
  const lineItem = new this.lineItemModel({
    ...productData,
    cart: cartId, //  Associe bien le produit au vrai Cart
    id: `cali_${Date.now()}`, // Génération d’un ID unique custom
  });

  //  Sauvegarde en base
  return await lineItem.save();
}


  // Récupérer tous les produits d’un panier
  async getCartItems(cartId: string): Promise<LineItem[]> {
    return this.lineItemModel
      .find({ cart: cartId })
      .populate('product')          // populate pour ramener le produit
      .populate('product_variant')  // populate la variante
      .populate('tax_lines')        // populate taxes
      .populate('adjustments')      // populate ajustements
      .exec();
  }
  
async calculateCartTotals(cartId: string): Promise<Cart> {
  const cart = await this.cartModel.findById(cartId)
  if (!cart) throw new NotFoundException(`Cart with ID ${cartId} not found`);

  let subtotal = 0;
  let discount_total = 0;
  let tax_total = 0;
  let shipping_total = 0;

  // === 1. Items (produits)
  for (const item of cart.items) {
    const itemTotal = item.unit_price * item.quantity;
    subtotal += itemTotal;

    if (item.adjustments?.length) {
      for (const adj of item.adjustments) {
        discount_total += adj.amount || 0;
      }
    }

    if (item.tax_lines?.length) {
      for (const taxLine of item.tax_lines) {
        tax_total += taxLine.amount || 0;
      }
    }
  }

  /*// === 2. Méthodes de livraison
  for (const method of cart.shipping_methods) {
    if (method.adjustments?.length) {
      for (const adj of method.adjustments) {
        shipping_total += adj.amount || 0;
      }
    }

    if (method.tax_lines?.length) {
      for (const taxLine of method.tax_lines) {
        tax_total += taxLine.amount || 0;
      }
    }

    shipping_total += typeof method.amount === 'number' ? method.amount : 0;
  }*/

  // === 3. Promotions globales (si disponibles)
  const promotions = await this.promotionModel.find({}); // on peut filtrer selon la date/valeur/eligibilité

  for (const promo of promotions) {
    // Ex : promo de 10% sur le panier si subtotal > 100
    if (promo.discount_type === 'percentage' && subtotal >= (promo.min_cart_total || 0)) {
      const discount = (promo.value / 100) * subtotal;
      discount_total += discount;
    }

    //  Ex : promo fixe
    if (promo.discount_type === 'fixed' && subtotal >= (promo.min_cart_total || 0)) {
      discount_total += promo.value;
    }
  }

  // === 4. Totaux
  cart.subtotal = subtotal;
  cart.discount_total = discount_total;
  cart.tax_total = tax_total;
  cart.shipping_total = shipping_total;
  cart.total = subtotal + shipping_total + tax_total - discount_total;

  await cart.save();
  return cart;
}



async removeItemFromCart(cartId: string, itemId: string): Promise<CartDocument> {
  const cart = await this.getCart(cartId);
  if (!cart) throw new NotFoundException(`Cart with id ${cartId} not found`);

  // Ici on suppose que cart.items est un tableau d'ObjectId
  cart.items = cart.items.filter(item => item.toString() !== itemId);
  await cart.save();

  await this.lineItemModel.findByIdAndDelete(itemId);

  const updatedCart = await this.getCart(cartId);
  if (!updatedCart) throw new NotFoundException(`Cart with id ${cartId} not found after update`);

  return updatedCart;
}


  async completeCart(cartId: string): Promise<CartDocument> {
    const cart = await this.getCart(cartId);  // cart is CartDocument here

    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.completed_at = new Date();
    await cart.save();

    return cart;
  }

  async updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<Cart> {
  if (quantity < 1) {
    return this.removeItemFromCart(cartId, itemId);
  }

  await this.lineItemModel.findByIdAndUpdate(itemId, { quantity });

  return this.getCart(cartId);
  }


  async deleteUser(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async deleteCart(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }



  async findAll(): Promise<string> {
    return `This action returns all cart`;
  }

  async findOne(id: string): Promise<Cart> {
  if (!isValidObjectId(id)) {
    throw new NotFoundException(`Invalid ID`);
  }
    const cart = await this.cartModel.findById(id)
      .populate('lineItems') // Populate les relations que tu as
      .populate('shippingMethods')
      .exec();

    if (!cart) {
      throw new NotFoundException(`Cart with id ${id} not found`);
    }

    return cart;
  }


  async update(id: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Invalid ID`);
    }

    const cart = await this.cartModel.findById(id);
    if (!cart) {
      throw new NotFoundException(`Panier avec l'ID ${id} non trouvé.`);
    }

    try {
      Object.assign(cart, updateCartDto);
      return await cart.save();
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du panier ${id}`, error.stack);
      throw new InternalServerErrorException('Une erreur est survenue lors de la mise à jour du panier.');
    }
  }

  async createCarts(
    data: CreateCartDto | CreateCartDto[],
    user: User,
    ): Promise<Cart[] | Cart> {
    // Ici tu peux utiliser user.id ou user pour lier le panier au propriétaire
    if (Array.isArray(data)) {
      return Promise.all(
        data.map(d => this.createOneCart(d, user)),
      );
    } else {
      return this.createOneCart(data, user);
    }
  }

  private async createOneCart(
    data: CreateCartDto,
    user: User,
  ): Promise<Cart> {
    // Exemple basique
    const newCart = new this.cartModel({
      ...data,
      user: user._id,
    });
    return newCart.save();
  }



  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
  if (!isValidObjectId(id)) {
    throw new NotFoundException(`Invalid ID`);
  }

    const result = await this.cartModel.findByIdAndDelete(id);

    if (!result) {
      return { deleted: false, message: `Panier avec l'ID ${id} non trouvé.` };
    }

    return { deleted: true, message: `Panier avec l'ID ${id} supprimé avec succès.` };
  }

  /**
   * Convertit { field: "ASC" | "DESC" } en { field: "asc" | "desc" }
   */
  private normalizeSortOrder(
    order: Record<string, 'ASC' | 'DESC'>
  ): { [key: string]: SortOrder } {
    const result: { [key: string]: SortOrder } = {};
    for (const key in order) {
      const value = order[key];
      if (value === 'ASC') {
        result[key] = 'asc';
      } else if (value === 'DESC') {
        result[key] = 'desc';
      }
    }
    return result;
  }


    // 1. Ajouter une méthode : Ajouter une méthode de livraison au panier
  async addShippingMethodToCart(cartId: string, shippingMethodId: string): Promise<Cart> {
    const shippingMethod = await this.shippingMethodModel.findById(shippingMethodId);
    if (!shippingMethod) {
      throw new NotFoundException(`Shipping method with id ${shippingMethodId} not found`);
    }

    const cart = await this.cartModel.findByIdAndUpdate(
      cartId,
      { $addToSet: { shipping_methods: shippingMethod._id } },
      { new: true }
    );

    if (!cart) throw new NotFoundException(`Cart with ID ${cartId} not found`);
    return this.calculateCartTotals(cartId);
  }

      // 2. Définir adresse de livraison
  async setShippingAddress(cartId: string, addressId: string): Promise<Cart> {
    const address = await this.addressModel.findById(addressId);
    if (!address) throw new NotFoundException('Shipping address not found');

    const updatedCart = await this.cartModel.findByIdAndUpdate(
      cartId,
      { shipping_address: address._id },
      { new: true }
    ).exec();

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return updatedCart;
  }

  // 3. Définir adresse de facturation
  async setBillingAddress(cartId: string, addressId: string): Promise<Cart> {
    const address = await this.addressModel.findById(addressId);
    if (!address) throw new NotFoundException('Billing address not found');

    const updatedCart = await this.cartModel.findByIdAndUpdate(
      cartId,
      { billing_address: address._id },
      { new: true }
    ).exec();

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return updatedCart;
  }

    // 4. Lier un utilisateur (client) au panier
  async setCustomer(cartId: string, customerId: string): Promise<Cart> {
    const updatedCart = await this.cartModel.findByIdAndUpdate(
      cartId,
      { customer_id: customerId },
      { new: true }
    ).exec();

    if (!updatedCart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return updatedCart;
  }



    // 5. Est-ce que le panier est prêt à être transformé en commande ?
  async isCartReadyForCheckout(cartId: string): Promise<boolean> {
    const cart = await this.getCart(cartId);

    const hasItems = cart.items.length > 0;
    const hasShippingMethod = cart.shipping_methods.length > 0;
    const hasShippingAddress = !!cart.shipping_address;
    const hasCurrency = !!cart.currency_code;

    return hasItems && hasShippingMethod && hasShippingAddress && hasCurrency;
  }


  async getFullCartForOrder(cartId: string): Promise<Cart> {
    const cart = await this.cartModel.findById(cartId)
      .populate({
        path: 'items',
        populate: ['adjustments', 'tax_lines']
      })
      .populate({
        path: 'shipping_methods',
        populate: ['adjustments', 'tax_lines']
      })
      .populate('shipping_address')
      .populate('billing_address')
      .populate('customer_id')
      .exec();

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart;
  }

}