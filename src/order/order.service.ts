import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order, OrderDocument } from './entities/CommandePrincipale/order.entity';
import { OrderStatus } from './order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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


  async findAllByStorePaginated(
    storeId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    if (!Types.ObjectId.isValid(storeId)) {
      throw new NotFoundException('storeId invalide');
    }

    const skip = (page - 1) * limit;

    const storeObjectId = new Types.ObjectId(storeId);

    // Récupération des commandes pour la boutique avec client et paiements
    const orders = await this.orderModel
      .find({ store: storeObjectId })
      .populate('customer_id','name, phone') // populate infos client
      .populate('payments') // populate paiements liés à la commande
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.orderModel.countDocuments({ store: storeObjectId });

    return {
      orders,
      meta: {
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


async findOne(orderId: string) {
  if (!orderId) throw new BadRequestException('ID de commande manquant');

  if (!Types.ObjectId.isValid(orderId)) {
    throw new BadRequestException('ID invalide');
  }

  const order = await this.orderModel
    .findById(orderId)
    .populate('customer_id')
    .populate('payments')
    .populate({
      path: 'items',
      populate: { path: 'item', model: 'OrderLineItem' }, // si tes OrderItem réfèrent OrderLineItem
    })
    .exec();

  if (!order) throw new NotFoundException('Commande non trouvée');

  // Calcul du total
  const total = order.items?.reduce((acc, item: any) => {
    const qty = Number(item.quantity ?? 0);
    const price = Number(item.unit_price ?? 0);
    return acc + qty * price;
  }, 0) ?? 0;

  // On retourne un objet propre
  return {
    ...order.toObject(),
    total,
  };
}

// order.service.ts
async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const order = await this.orderModel.findById(orderId);
  console.log("Order ID reçu dans le controller :", order);

  if (!order) {
    throw new NotFoundException('Commande introuvable');
  }

  order.status = status;
  return await order.save();
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


}
