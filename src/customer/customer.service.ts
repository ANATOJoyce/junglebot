import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument, CustomerStatus } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { VerificationCodeService } from 'src/verification/verification-code.service';
import { MailService } from 'src/mail/mail.service';
import { ProviderIdentity, ProviderIdentityDocument } from 'src/auth/entities/provider-identity.entity';
import { VerificationCode, VerificationCodeDocument, VerificationType } from 'src/verification/entities/verification-code.entity';
import * as bcrypt from 'bcrypt';
import { Order, OrderDocument } from 'src/order/entities/CommandePrincipale/order.entity';


@Injectable()
export class CustomerService {
    constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
            @InjectModel(VerificationCode.name)  private verificationCodeModel: Model<VerificationCodeDocument>,
                private mailService: MailService,
                private readonly verificationCodeService: VerificationCodeService,
            @InjectModel(Order.name)  private orderModel: Model<OrderDocument>,

                ) {}

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<any> {
    const { name, email, password } = createCustomerDto;

    // Vérifier si l'email existe déjà
    const existing = await this.customerModel.findOne({ email });
    if (existing) {
      throw new BadRequestException('Email déjà utilisé.');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le customer
    const customer = new this.customerModel({
      name,
      email,
      password: hashedPassword,
      status: CustomerStatus.NOUVEAU,
    });

    const savedCustomer = await customer.save();

    // Générer et envoyer le code de vérification par mail
    await this.createCustomerVerificationCode(email, name);

    // Retourner le customer sans le mot de passe
    const { password: _, ...customerData } = savedCustomer.toObject();
    return customerData;
  }

  async createCustomerVerificationCode(email: string, name: string): Promise<string> {
    // Générer un code aléatoire à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Date d’expiration : 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Sauvegarder le code dans la collection VerificationCode
    await this.verificationCodeModel.create({
      email,
      code,
      type: VerificationType.ACCOUNT,
      expiresAt,
    });

    // Préparer le mail
    const subject = 'Bienvenue sur Jungle 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #fbb344;">Bienvenue, ${name} !</h1>
        <p>Votre compte a été créé avec succès.</p>
        <p>Veuillez confirmer votre adresse email avec le code ci-dessous :</p>
        <h2 style="color:#fbb344;letter-spacing:3px;">${code}</h2>
        <p style="margin-top: 20px;">Ce code est valable pendant 15 minutes.</p>
      </div>
    `;

    await this.mailService.sendMail({
      to: email,
      subject,
      html,
    });

    return code;
  }

  async verifyAccountCode(email: string, code: string) {
    const verification = await this.verificationCodeModel.findOne({ email, code, type: VerificationType.ACCOUNT });
    if (!verification) throw new BadRequestException('Code invalide ou expiré.');
    if (verification.expiresAt < new Date()) throw new BadRequestException('Code expiré.');

    // Nettoyage après vérification
    await this.verificationCodeModel.deleteOne({ _id: verification._id });

    // Mettre à jour le Customer
    await this.customerModel.updateOne({ email }, { $set: { isEmailVerified: true } });

    return { message: 'Code validé avec succès. Votre email est maintenant confirmé.' };
  }


  async resendVerificationCode(email: string) {
  const customer = await this.customerModel.findOne({ email });

  if (!customer) {
    throw new BadRequestException('Compte introuvable');
  }

  if (customer.isEmailVerified) {
    throw new BadRequestException('Compte déjà vérifié');
  }

  if (!customer.email) {
  throw new BadRequestException("Email du client manquant");
}
  await this.createCustomerVerificationCode(
    customer.email,
    customer.name || 'Client',
  );

  return {
    message: 'Un nouveau code a été envoyé par email',
  };
}


  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerModel.findOne({ email }).exec();
  }

  async authenticate(email: string, password: string) {
  const customer = await this.customerModel.findOne({ email });

  if (!customer) {
    return null;
  }

  const isValid = await bcrypt.compare(password, customer.password);

  if (!isValid) {
    return null;
  }

  return {
    customerId: customer._id,
    email: customer.email,
    name: customer.name,
  };
}
  async getAllCustomers(): Promise<Customer[]> {
    return this.customerModel.find().exec();
  }

  async getCustomerById(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id);
    if (!customer) throw new NotFoundException('Customer non trouvé');
    return customer;
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerModel.findByIdAndUpdate(id, dto, { new: true });
    if (!customer) throw new NotFoundException('Customer non trouvé');
    return customer;
  }

  async deleteCustomer(id: string): Promise<Customer> {
    const customer = await this.customerModel.findByIdAndDelete(id);
    if (!customer) throw new NotFoundException('Customer non trouvé');
    return customer;
  }


 async verifyCode(email: string, code: string, type: VerificationType): Promise<boolean> {
    const user = await this.customerModel.findOne({ email });
    if (!user) return false;

    const verification = await this.verificationCodeModel.findOne({
      email,
      code,
      type,
    });

    if (!verification) return false;
    if (verification.expiresAt < new Date()) return false;

    // Nettoyage après vérification
    await this.verificationCodeModel.deleteOne({ _id: verification._id });

    return true;
  }


  async getCustomerWithOrders(customerId: string) {
  if (!Types.ObjectId.isValid(customerId)) {
    throw new BadRequestException('ID client invalide');
  }

  return this.customerModel
    .findById(customerId)
    .populate({
      path: 'orders',
      model: 'Order',
    });
}
async findCustomersWithOrders(): Promise<any[]> {
  const customers = await this.customerModel.find().lean();
  const customerIds = customers.map(c => c._id);

  const orders = await this.orderModel
    .find({ customer: { $in: customerIds } })
    .populate('items.product', 'name price')
    .lean();

  const ordersByCustomer = orders.reduce((acc, order) => {
    const cid = order.customer.toString();
    if (!acc[cid]) acc[cid] = [];
    acc[cid].push(order);
    return acc;
  }, {} as Record<string, any[]>);

  return customers.map(c => ({
    ...c,
    orders: ordersByCustomer[c._id.toString()] || [],
  }));
}

  
}
