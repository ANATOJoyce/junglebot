import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './entities/CommandePrincipale/order.entity';
import { OrderStatus } from './order-status.enum';
import { Cart, CartDocument, CartStatus } from 'src/cart/entities/cart.entity';
import { MailService } from 'src/mail/mail.service';
import { Customer, CustomerDocument } from 'src/customer/entities/customer.entity';
import { Product, ProductDocument } from 'src/product/entities/product.entity';
interface OrderQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
@Injectable()
export class OrdersService {
  constructor(
   @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
@InjectModel(Order.name) private orderModel: Model<OrderDocument>,
@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
@InjectModel(Product.name) private productModel: Model<ProductDocument>,


    private mailService: MailService,
    
  ) {}

  /** Crée une commande globale */
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const mapped = {
      ...createOrderDto,
      items: createOrderDto.items?.map((id) => new Types.ObjectId(id)),
      credit_lines: createOrderDto.credit_lines?.map((id) => new Types.ObjectId(id)),
      customer_id: createOrderDto.customer_id ? new Types.ObjectId(createOrderDto.customer_id) : null,
    };

    const createdOrder = new this.orderModel(mapped);
    return createdOrder.save();
  }

  /** Récupère toutes les commandes */
 async findAll(): Promise<Order[]> {
  return this.orderModel.find().exec(); 
 }


  /** Crée une commande dans une boutique spécifique */
async createOrderInStore(createOrderDto: CreateOrderDto, storeId: string): Promise<Order> {if (!storeId || !Types.ObjectId.isValid(storeId)) {
    throw new BadRequestException('ID de boutique invalide');
  }

  const lastOrder = await this.orderModel.findOne({ store: storeId }).sort({ display_id: -1 }).exec();
  const nextDisplayId = lastOrder ? lastOrder.display_id + 1 : 1000;

  const mapped = {
    ...createOrderDto,
    store: new Types.ObjectId(storeId),
    display_id: nextDisplayId,
    items: createOrderDto.items?.map(id => new Types.ObjectId(id)) || [],
    credit_lines: createOrderDto.credit_lines?.map(id => new Types.ObjectId(id)) || [],
    customer_id: createOrderDto.customer_id ? new Types.ObjectId(createOrderDto.customer_id) : null,
  };

  const order = new this.orderModel(mapped);

  return order.save();
 }



async getOrdersByStore(
  storeId: string,
  options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
  const { page, limit, search, status, startDate, endDate } = options;

  const query: any = {};

  // ⚡ Filtrer par store via les produits
  if (storeId) {
    const productIds = await this.productModel
      .find({ storeId })
      .select('_id');
    query['items.product'] = { $in: productIds.map(p => p._id) };
  }

  // ⚡ Filtrer par statut
  if (status) {
    query.status = status;
  }

  // ⚡ Filtrer par date
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // ⚡ Recherche par display_id ou email client
  if (search) {
    query.$or = [
      { display_id: { $regex: search, $options: 'i' } },
      { 'customer.email': { $regex: search, $options: 'i' } },
    ];
  }

  // ⚡ Pagination
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.orderModel
      .find(query)
      .populate('customer')
      .populate('items.product')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec(),
    this.orderModel.countDocuments(query),
  ]);

  return { data, total, page, limit };
}

async createOrder(customerId: string, sessionId: string): Promise<Order> {
  // 1️⃣ Récupérer le panier actif
  const cart = await this.cartModel.findOne({
    $or: [{ customer: customerId }, { sessionId }],
    status: CartStatus.ACTIVE
  }).populate({
    path: 'items.product',
    populate: {
      path: 'storeId',
      populate: { path: 'owner', select: 'email name' }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw new NotFoundException('Panier vide ou introuvable');
  }

  // 2️⃣ Vérifier le stock pour chaque produit
  for (const item of cart.items) {
    const product: any = item.product;
    if (product.totalStock < item.quantity) {
      throw new Error(`Stock insuffisant pour le produit ${product.title}`);
    }
  }

  // 3️⃣ Générer un display_id unique
  const lastOrder = await this.orderModel.findOne().sort({ display_id: -1 });
  let lastNumber = 0;
  if (lastOrder?.display_id) {
    const match = lastOrder.display_id.match(/jungle#(\d+)/);
    if (match) lastNumber = parseInt(match[1], 10);
  }
  const displayId = `jungle#${lastNumber + 1}`;

  // 4️⃣ Créer la commande
  const order = await this.orderModel.create({
    display_id: displayId,
    customer: customerId,
    items: cart.items.map(i => ({
      product: i.product._id,
      quantity: i.quantity
    })),
    total: cart.total,
    status: OrderStatus.PENDING
  });

  // 5️⃣ Décrémenter le stock pour chaque produit via updateOne
  for (const item of cart.items) {
    await this.productModel.updateOne(
      { _id: item.product._id },
      { $inc: { totalStock: -item.quantity } }
    );
  }

  // 6️⃣ Mettre à jour le panier
  cart.status = CartStatus.ORDERED;
  await cart.save();

  // 7️⃣ Récupérer les infos du client
  const customer = await this.customerModel.findById(customerId).select('email name');
  if (!customer?.email) throw new NotFoundException('Email client introuvable');

  // 8️⃣ Envoyer l’email au client
  await this.mailService.sendMail({
    to: customer.email,
    subject: 'Confirmation de votre commande',
    html: `
      <h2>Merci pour votre commande 🎉</h2>
      <p>Commande <strong>${order.display_id}</strong> confirmée.</p>
    `
  });

  // 9️⃣ Envoyer un mail aux propriétaires des boutiques
  const owners = new Set<string>();
  for (const item of cart.items) {
    const product: any = item.product;
    const owner = product?.storeId?.owner;
    if (owner?.email && !owners.has(owner.email)) {
      owners.add(owner.email);

      await this.mailService.sendMail({
        to: owner.email,
        subject: 'Nouvelle commande dans votre boutique',
        html: `
          <h2>Bonjour ${owner.name},</h2>
          <p>Une nouvelle commande <strong>${order.display_id}</strong> a été passée dans votre boutique.</p>
          <p>Produit concerné : <strong>${product.title}</strong></p>
        `
      });
    }
  }

  return order;
}

async getStoreStats(
  storeId: string,
  options: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ data: Order[]; total: number }> {

  const { status, startDate, endDate } = options;

  // 1️⃣ récupérer les produits de la boutique
  const productIds = await this.productModel
    .find({ storeId: new Types.ObjectId(storeId) })
    .distinct('_id');

  //  sécurité
  if (productIds.length === 0) {
    return { data: [], total: 0 };
  }

  // 2️⃣ requête correcte
  const query: any = {
    items: {
      $elemMatch: {
        product: { $in: productIds }
      }
    }
  };

  // 3️⃣ filtres optionnels
  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 4️⃣ requête finale
  const [data, total] = await Promise.all([
    this.orderModel
      .find(query)
      .populate('customer')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .exec(),
    this.orderModel.countDocuments(query),
  ]);

  return { data, total };
}


// order.service.ts
async updateCustomerStatus(customerId: string, status: string) {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new NotFoundException('ID client invalide');
  }

  const customer = await this.customerModel.findById(customerId).exec();
  if (!customer) {
    throw new NotFoundException('Client introuvable');
  }

  // Mise à jour du statut
  customer.status = status;
  await customer.save();

  // Vérifier l'email
  if (!customer.email) {
    throw new NotFoundException('Email client introuvable');
  }

  // Envoyer l’email de notification
  await this.mailService.sendMail({
    to: customer.email,
    subject: 'Mise à jour de votre statut',
    html: `
      <h2>Bonjour ${customer.name},</h2>
      <p>Votre statut a été mis à jour : <strong>${status}</strong>.</p>
      <p>Merci de votre confiance </p>
    `,
  });

  return {
    message: 'Statut du client mis à jour avec succès et email envoyé',
    customer,
  };
}
async getOrdersByCustomer(customerId: string) {
  return this.orderModel.find({
    customer: customerId,
  });
}
async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderModel
      .find({ customer: customerId })
      .populate('customer', 'name email') // pour récupérer les infos du client
      .populate('items.product', 'name price') // pour récupérer les infos produits
      .sort({ createdAt: -1 })
      .exec();
  }

 async getCustomersByStore(
    storeId: string,
    options: { page: number; limit: number; search?: string; type?: string },
  ) {
    const { page, limit, search, type } = options;

    // 1️⃣ Récupérer tous les produits du store
    const products = await this.productModel
      .find({ storeId: new Types.ObjectId(storeId) })
      .select('_id')
      .lean();

    const productIds = products.map(p => p._id);

    // 2️⃣ Récupérer toutes les commandes contenant ces produits
    const orders = await this.orderModel
      .find({ 'items.product': { $in: productIds } })
      .populate({ path: 'customer', select: 'name email status isEmailVerified' })
      .populate({ path: 'items.product', select: 'name price' })
      .lean();

    // 3️⃣ Construire une liste de clients uniques
    const customersMap = new Map<string, any>();
    orders.forEach(order => {
      const customer = order.customer;
      if (!customer) return;

      if (!customersMap.has(customer._id.toString())) {
        customersMap.set(customer._id.toString(), { ...customer, orders: [] });
      }
      customersMap.get(customer._id.toString()).orders.push(order);
    });

    let customers = Array.from(customersMap.values());

    // 4️⃣ Filtrage search
    if (search) {
      customers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // 5️⃣ Filtrage type
    if (type) {
      customers = customers.filter(c => c.status === type);
    }

    // 6️⃣ Pagination
    const total = customers.length;
    const start = (page - 1) * limit;
    const paginated = customers.slice(start, start + limit);

    return {
      customers: paginated,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // orders.service.ts
async updateOrderStatus(orderId: string, status: string) {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new NotFoundException('ID commande invalide');
  }

  const order = await this.orderModel
    .findById(orderId)
    .populate('customer')
    .exec();

  if (!order) {
    throw new NotFoundException('Commande introuvable');
  }

order.status = status as OrderStatus;

  await order.save();

  const customer = order.customer as any;
  if (!customer?.email) {
    throw new NotFoundException('Email client introuvable');
  }

  // Exemple d’image statique (logo, bannière, etc.)
  await this.mailService.sendMail({
    to: customer.email,
    subject: `Mise à jour de votre commande ${order.display_id}`,
    html: `
      <h2>Bonjour ${customer.name},</h2>
      <p>Votre commande <strong>${order.display_id}</strong> est maintenant <strong>${status}</strong>.</p>
    `,
  });

  return {
    message: 'Statut de la commande mis à jour et email envoyé',
    order,
  };
}

  /** Met à jour une commande par UUID */
  async update(orderId: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const mapped = {
      ...updateOrderDto,
      items: updateOrderDto.items?.map((id) => new Types.ObjectId(id)),
      credit_lines: updateOrderDto.credit_lines?.map((id) => new Types.ObjectId(id)),
      customer_id: updateOrderDto.customer_id ? new Types.ObjectId(updateOrderDto.customer_id) : null,
    };

    const updated = await this.orderModel.findOneAndUpdate({ id: orderId }, mapped, { new: true }).exec();
    if (!updated) throw new NotFoundException(`Commande avec id ${orderId} non trouvée`);

    return updated;
  }

  /** Supprime une commande par UUID */
  async remove(orderId: string): Promise<Order> {
    const deleted = await this.orderModel.findOneAndDelete({ id: orderId }).exec();
    if (!deleted) throw new NotFoundException(`Commande avec id ${orderId} non trouvée`);

    return deleted;
  }



  async findByStoreSince(storeId: string, since: Date) {
  return this.orderModel
    .find({
      store: storeId,
      createdAt: { $gte: since },
    })
    .populate('customer')
    .exec();
}


  async getCustomerDetails(customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) {
      throw new NotFoundException('ID client invalide');
    }

    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Client introuvable');
    }

    const orders = await this.orderModel
      .find({ customer: new Types.ObjectId(customerId) })
      .populate('items.product')
      .exec();

    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
      customer,
      orders,
      stats: {
        totalOrders: orders.length,
        totalSpent,
      },
    };
  }



 async getOrderById(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('ID de commande invalide');
    }

    const order = await this.orderModel
      .findById(orderId)
      .populate('customer')
      .populate('items.product')
      .populate('cart')
      .exec();

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return {
      _id: order._id,
      display_id: order.display_id,
      status: order.status,
      total: order.total,
      customer: order.customer,
      items: order.items,
      cart: order.cart,
    
    };
  }

 

}


