import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { Manager, ManagerDocument, ManagerStatus } from './manager.entity';
import { Otp, OtpDocument } from 'src/otp/otp.entity';
import { RegisterDto } from 'src/auth/dto/Register.dto';
import { Role } from 'src/auth/role.enum';


@Injectable()
export class ManagerService {
  constructor(
    @InjectModel(Manager.name) private managerModel: Model<ManagerDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  private generateOtp(length = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Crée un manager et envoie l'OTP
  async createManager(registerDto: RegisterDto, vendorId: string): Promise<Partial<Manager>> {
    const existing = await this.managerModel.findOne({ email: registerDto.email });
    if (existing) throw new BadRequestException('Ce manager exite deja ');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const manager = new this.managerModel({
      ...registerDto,
      password: hashedPassword,
      status: ManagerStatus.PENDING,
      managedStores: [],
      assignedBy: new Types.ObjectId(vendorId),
    });

    const savedManager = await manager.save();

    // Générer OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const otp = new this.otpModel({
      email: savedManager.email,
      code: otpCode,
      expiresAt,
    });

    await otp.save();

    // Envoyer l'OTP par mail
    await this.mailerService.sendMail({
      to: savedManager.email,
      subject: 'Votre OTP pour activer le compte Manager',
      text: `Bonjour ${savedManager.first_name}, votre OTP pour activer le compte est : ${otpCode}. Il est valide 10 minutes.`,
    });

    // Retourner sans mot de passe
    const { password, ...result } = savedManager.toObject();
    return result as Partial<Manager>;
  }

  // Vérifier l'OTP et activer le compte
  async verifyOtp(email: string, code: string): Promise<{ accessToken: string }> {
    const otp = await this.otpModel.findOne({ email, code, isUsed: false });
    if (!otp) throw new BadRequestException('OTP invalide');
    if (otp.expiresAt < new Date()) throw new BadRequestException('OTP expiré');

    otp.isUsed = true;
    await otp.save();

    const manager = await this.managerModel.findOne({ email });
    if (!manager) throw new BadRequestException('Manager non trouvé');

    manager.status = ManagerStatus.ACTIVE;
    await manager.save();

    // Générer JWT
    const payload = {
      sub: manager._id,
      email: manager.email,
      first_name: manager.first_name,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { accessToken };
  }

    // Récupérer un manager avec le vendeur qui l'a nommé
async findByIdWithVendor(managerId: string): Promise<Partial<Manager> | null> {
  const manager = await this.managerModel
    .findById(managerId)
    .populate('assignedBy', 'first_name last_name email')
    .select('-password');

  if (!manager) return null;
  return manager.toObject() as Partial<Manager>;
}

}
