import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from 'src/customer/entities/customer.entity';
import { OrderItem } from 'src/order/entities/CommandePrincipale/order-item.entity';
import { Order, OrderDocument } from 'src/order/entities/CommandePrincipale/order.entity';
import { Product } from 'src/product/entities/product.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /**
   * Statistiques clients : nombre total, total dépensé, commandes par client
   */
  async getCustomerStats(storeId: string) {
    // On récupère toutes les commandes du store
    const orders = await this.orderModel.find({ store: storeId })
      .populate('customer_id')
      .lean();

    const customerMap: Record<string, { name: string; totalSpent: number; totalOrders: number; lastOrderDate: Date | null }> = {};

    for (const order of orders) {
      const customerId = order.customer?._id?.toString() ?? 'unknown';
      const name = order.customer?.first_name ?? 'Client inconnu';

      if (!customerMap[customerId]) {
        customerMap[customerId] = { name, totalSpent: 0, totalOrders: 0, lastOrderDate: null };
      }

      customerMap[customerId].totalSpent += order.total ?? 0;
      customerMap[customerId].totalOrders += 1;

      const orderDate = order.createdAt ?? new Date();
      if (!customerMap[customerId].lastOrderDate || orderDate > customerMap[customerId].lastOrderDate) {
        customerMap[customerId].lastOrderDate = orderDate;
      }
    }

    const customers = Object.values(customerMap);

    const totalCustomers = customers.length;
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    return { totalCustomers, totalSpent, avgSpent, customers };
  }

   async getOrderStats(storeId: string) {
    const orders = await this.orderModel.find({ store: storeId }).lean();

    // Commandes par statut
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      const s = o.status ?? 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });

    // Commandes par mois
    const ordersByMonth: Record<string, number> = {};
    orders.forEach(o => {
      const date = o.createdAt ?? new Date();
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      ordersByMonth[monthKey] = (ordersByMonth[monthKey] || 0) + 1;
    });

    // Chiffre d'affaires total
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

    return { totalOrders: orders.length, totalRevenue, statusCounts, ordersByMonth };
  }

  /**
   * Statistiques produits
   */
async getProductStats(storeId: string) {
    // On récupère toutes les commandes du store
    const orders = await this.orderModel
      .find({ store: storeId })
      .populate<{ items: (OrderItem & { quantity?: number })[] }>('items') // typage correct
      .lean();

    // Map des produits vendus
    const productMap: Record<
      string,
      { title: string; totalSold: number; totalRevenue: number }
    > = {};

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const productId = (item as any)._id?.toString() ?? 'unknown';
        const productName = (item as any).title ?? 'Produit inconnu';
        const quantity = (item as any).quantity ?? 0;
        const price = (item as any).price ?? 0;

        if (!productMap[productId]) {
          productMap[productId] = {
            title: productName,
            totalSold: 0,
            totalRevenue: 0,
          };
        }

        productMap[productId].totalSold += quantity;
        productMap[productId].totalRevenue += quantity * price;
      }
    }

    const products = Object.values(productMap);

    // Totaux globaux
    const totalProductsSold = products.reduce((sum, p) => sum + p.totalSold, 0);
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);

    return { totalProductsSold, totalRevenue, products };
  }


  async getAllOrdersByStore(storeId: string) {
    if (!Types.ObjectId.isValid(storeId)) {
      throw new NotFoundException('storeId invalide');
    }

    const storeObjectId = new Types.ObjectId(storeId);

    // Récupération simple des commandes pour la boutique avec client
    const orders = await this.orderModel
      .find({ store: storeObjectId })
      .populate('customer_id', 'name') // juste le nom du client
      .sort({ createdAt: -1 })
      .lean();

    return orders;
  }

/*
  async getAllProductsByStore(storeId: string) {
  if (!Types.ObjectId.isValid(storeId)) {
    throw new Error(`storeId invalide: ${storeId}`);
  }

  const storeObjectId = new Types.ObjectId(storeId.trim());

  const products = await this.productModel
    .find({ storeId: storeObjectId })
    .populate('storeId', 'name') // inclut le nom de la boutique
    .sort({ createdAt: -1 })
    .exec();

  // Calcul du stock total par produit
  const productsWithTotalStock = products.map((product) => {
    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
    return {
      ...product.toObject(),
      totalStock,
      store: product.storeId, // renomme pour le front
    };
  });

  return productsWithTotalStock;
}
*/



}
