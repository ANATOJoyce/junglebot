import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { TokensDto } from 'src/auth/dto/tokens.dto';
import { Role } from 'src/auth/role.enum';
import { RegisterDto } from './dto/registerCustomer.dto';
import { v4 as uuidv4 } from 'uuid';
import { Customer, CustomerDocument, CustomerStatus } from './entities/customer.entity';
import { CustomerGroup, CustomerGroupDocument } from './entities/customer-group.entity';
import { CustomerGroupCustomer, CustomerGroupCustomerDocument } from './entities/customer-group-customer.entity';
import { CreateCustomerGroupDto, UpdateCustomerGroupDto } from './dto/customer-group.dto';
import { CreateCustomerGroupCustomerDto, UpdateCustomerGroupCustomerDto } from './dto/customer-group-customer.dto';
import { Order, OrderDocument } from 'src/order/entities/CommandePrincipale/order.entity';

export interface CustomerOrder {
  _id: string;
  display_id: string;
  total: number;
  status: string;
  currency_code: string;
  createdAt: Date;
  payments?: Array<{ status: string; amount: number }>;
  items?: Array<{ quantity: number; item: { title: string; price: number } }>;
}

export interface CustomerSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  avgOrderValue: number;
  orders: CustomerOrder[];
}
@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerGroup.name) private customerGroupModel: Model<CustomerGroupDocument>,
     @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,

    @InjectModel(CustomerGroupCustomer.name) private customerGroupCustomerModel: Model<CustomerGroupCustomerDocument>,
  ) {}

  async register(dto: RegisterDto): Promise<Customer> {
      const created = new this.customerModel(dto);
      return created.save();
    }

    async findAll(): Promise<Customer[]> {
      return this.customerModel.find().exec();
    }

    async findOne(id: number): Promise<Customer> {
      const customer = await this.customerModel.findById(id).exec();
      if (!customer) throw new NotFoundException('Customer not found');
      return customer;
    }

   /* async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
      const updated = await this.customerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
      if (!updated) throw new NotFoundException('Customer not found');
      return updated;
    }
*/
    async remove(id: number): Promise<Customer> {
      const deleted = await this.customerModel.findByIdAndDelete(id).exec();
      if (!deleted) throw new NotFoundException('Customer not found');
      return deleted;
    }

  // -----------------------------
  // CUSTOMER GROUP
  // -----------------------------
  async createGroup(dto: CreateCustomerGroupDto, storeId: string): Promise<CustomerGroup> {
    const created = new this.customerGroupModel({ ...dto, storeId });
    return created.save();
  }

  async findAllGroups(storeId: string): Promise<CustomerGroup[]> {
    return this.customerGroupModel
      .find({ storeId, deleted_at: null })
      .populate('customers')
      .exec();
  }

  async findGroup(id: string, storeId: string): Promise<CustomerGroup> {
    const group = await this.customerGroupModel
      .findOne({ _id: id, storeId, deleted_at: null })
      .populate('customers')
      .exec();
    if (!group) throw new NotFoundException('CustomerGroup not found');
    return group;
  }

  async updateGroup(id: string, storeId: string, dto: UpdateCustomerGroupDto): Promise<CustomerGroup> {
    const updated = await this.customerGroupModel
      .findOneAndUpdate({ _id: id, storeId, deleted_at: null }, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('CustomerGroup not found');
    return updated;
  }

  async removeGroup(id: string, storeId: string): Promise<CustomerGroup> {
    const deleted = await this.customerGroupModel.findOneAndUpdate(
      { _id: id, storeId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true },
    );
    if (!deleted) throw new NotFoundException('CustomerGroup not found');
    return deleted;
  }

  // -----------------------------
  // CUSTOMER GROUP CUSTOMER
  // -----------------------------
  async createGroupCustomer(dto: CreateCustomerGroupCustomerDto, storeId: string): Promise<CustomerGroupCustomer> {
    const id = `cusgc_${uuidv4()}`;
    const created = new this.customerGroupCustomerModel({ ...dto, id, storeId });
    return created.save();
  }

  async findAllGroupCustomers(storeId: string): Promise<CustomerGroupCustomer[]> {
    return this.customerGroupCustomerModel
      .find({ storeId, deleted_at: null })
      .populate('customer_group')
      .exec();
  }

  async findGroupCustomer(id: string, storeId: string): Promise<CustomerGroupCustomer> {
    const entity = await this.customerGroupCustomerModel
      .findOne({ id, storeId, deleted_at: null })
      .populate('customer_group')
      .exec();
    if (!entity) throw new NotFoundException('CustomerGroupCustomer not found');
    return entity;
  }

  async updateGroupCustomer(id: string, storeId: string, dto: UpdateCustomerGroupCustomerDto): Promise<CustomerGroupCustomer> {
    const updated = await this.customerGroupCustomerModel
      .findOneAndUpdate({ id, storeId, deleted_at: null }, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('CustomerGroupCustomer not found');
    return updated;
  }

  async removeGroupCustomer(id: string, storeId: string): Promise<CustomerGroupCustomer> {
    const deleted = await this.customerGroupCustomerModel.findOneAndUpdate(
      { id, storeId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true },
    );
    if (!deleted) throw new NotFoundException('CustomerGroupCustomer not found');
    return deleted;
  }

 async findAllWithDetails(): Promise<any[]> {
    const customers = await this.customerModel.find().lean();

    const detailedCustomers = await Promise.all(
      customers.map(async (customer) => {
        // Récupérer toutes les commandes du client
        const orders = await this.orderModel
          .find({ customer_id: customer._id })
          .select('total createdAt')
          .sort({ createdAt: -1 })
          .lean();

        // Calculer la date de la dernière commande
        const lastOrderDate = orders.length
          ? new Date(Math.max(...orders.map((o) => new Date(o.createdAt!).getTime())))
          : null;

        return {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          status: customer.status,
          createdAt: customer.createdAt,
          lastOrderDate,
          orderCount: orders.length,
        };
      }),
    );

    return detailedCustomers;
  }


async findAllByStore(storeId: string, page = 1, limit = 10) {
    if (!Types.ObjectId.isValid(storeId)) {
      throw new NotFoundException('storeId invalide');
    }

    const skip = (page - 1) * limit;
    const storeObjectId = new Types.ObjectId(storeId);

    // Récupérer toutes les commandes de la boutique avec info client
    const orders = await this.orderModel
      .find({ store: storeObjectId })
      .populate('customer_id', 'name email phone createdAt') // infos client
      .populate('items') // si besoin côté front
      .exec();

    // Grouper les commandes par client
    const customerMap = new Map<string, {
      customer: Customer;
      orders: Order[];
      totalSpent: number;
    }>();

    for (const order of orders) {
      const customer = order.customer as Customer;
      if (!customer) continue;

      const customerId = (customer._id as Types.ObjectId).toString();
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customer,
          orders: [],
          totalSpent: 0,
        });
      }

      const entry = customerMap.get(customerId)!;
      entry.orders.push(order);

      // Calcul total dépensé
      entry.totalSpent += order.items?.reduce((sum, item) => {
        // item.product_name et item.unit_price sont définis
        return sum + (item.quantity * item.price);
      }, 0) || 0;
    }

    // Transformer en tableau avec stats
    const customersWithStats = Array.from(customerMap.values()).map(entry => {
      const sortedOrders = entry.orders.sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
      const lastOrder = sortedOrders[0] || null;

      return {
        _id: entry.customer._id,
        name: entry.customer.name,
        email: entry.customer.email,
        phone: entry.customer.phone,
        createdAt: entry.customer.createdAt,
        totalOrders: entry.orders.length,
        totalSpent: entry.totalSpent,
        lastOrderDate: lastOrder?.createdAt || null,
        avgOrderValue: entry.orders.length ? entry.totalSpent / entry.orders.length : 0,
        orders: entry.orders, // toutes les commandes si besoin côté front
      };
    });

    // Pagination
    const total = customersWithStats.length;
    const paginated = customersWithStats.slice(skip, skip + limit);

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
}