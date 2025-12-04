import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationCode, VerificationCodeDocument, VerificationType } from './entities/verification-code.entity';
import { MailService } from 'src/mail/mail.service';
import { User, UserDocument } from 'src/user/entities/user.entity';

@Injectable()
export class VerificationCodeService {
  constructor(
    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCodeDocument>,
    
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Génère un code et l'envoie par email
   */
  async generateAndSendCode(email: string, type: VerificationType): Promise<void> {
    if (!email) throw new BadRequestException('Adresse email requise');

    // Génération d’un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Sauvegarde du code
    await this.verificationCodeModel.create({
      email,
      code,
      type,
    });

    // Envoi du mail
    await this.mailService.sendVerificationCodeEmail(email, code, type);
  }

  /**
   * Vérifie le code fourni par l'utilisateur
   */


  /**
   * Nettoyage automatique des codes expirés (optionnel, via cron ou schedule)
   */
  async cleanExpiredCodes() {
    const expiration = new Date(Date.now() - 15 * 60 * 1000); // 15 min
    await this.verificationCodeModel.deleteMany({ createdAt: { $lt: expiration } });
  }



 async createVerificationCode(email: string, type: VerificationType): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min de validité

    await this.verificationCodeModel.create({
      user: user._id,
      code,
      type,
      expiresAt,
    });

    return code;
  }

  /**
   * Vérifie qu’un code est encore valide
   */
  async verifyCode(email: string, code: string, type: VerificationType): Promise<boolean> {
    const user = await this.userModel.findOne({ email });
    if (!user) return false;

    const verification = await this.verificationCodeModel.findOne({
      user: user._id,
      code,
      type,
    });

    if (!verification) return false;
    if (verification.expiresAt < new Date()) return false;

    // Nettoyage après vérification
    await this.verificationCodeModel.deleteOne({ _id: verification._id });

    return true;
  }

}
