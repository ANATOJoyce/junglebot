// auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException, Post, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/user/entities/user.entity';
import { RegisterDto } from './dto/Register.dto';
import { AuthIdentity, AuthIdentityDocument } from './entities/auth-identity.entity';
import { ProviderIdentity, ProviderIdentityDocument } from './entities/provider-identity.entity';
import { isValidObjectId, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UpdateAuthIdentityDto } from './dto/update-auth-identity.dto';
import { UpdateProviderIdentityDto } from './dto/update-provide-identity.dto';
import { Role } from './role.enum';
import { MailService } from 'src/mail/mail.service';
import { VerificationCode } from './entities/verification-code.entity';
import { OtpService } from 'src/otp/otp.service';
import { TokensDto } from './dto/tokens.dto';
import { UpdateProviderDto } from './dto/update-provide.dto';
import { OtpModule } from 'src/otp/otp.module';
import { Otp } from 'src/otp/otp.entity';
import { VerificationCodeDocument, VerificationType } from 'src/verification/entities/verification-code.entity';
import { VerificationCodeService } from 'src/verification/verification-code.service';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
    private readonly verificationCodeService: VerificationCodeService,

    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCodeDocument>,

    @InjectModel(AuthIdentity.name)
    private readonly authIdentityModel: Model<AuthIdentityDocument>,

    @InjectModel(User.name) private readonly userModel: Model<User>,

    @InjectModel(Otp.name) private readonly OtpModel: Model<Otp>,


    @InjectModel(ProviderIdentity.name)private readonly providerIdentityModel: Model<ProviderIdentityDocument>,
    private mailService: MailService,
  ) {}

  // auth.service.ts
  private readonly refreshTokens: Map<string, string> = new Map();


  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { phone, email, password, first_name, last_name, role } = registerDto;

    // Vérification des doublons
    const existingUserByPhone = await this.userService.findByPhone(phone);
    if (existingUserByPhone) {
      throw new BadRequestException('Un utilisateur avec ce téléphone existe déjà.');
    }

    if (email) {
      const existingUserByEmail = await this.userService.findByEmail(email);
      if (existingUserByEmail) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
      }

      const existingAuthIdentityByEmail = await this.authIdentityModel.findOne({ email });
      if (existingAuthIdentityByEmail) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
      }
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || Role.VENDOR;

    // Création du user
    const newUser = await this.userService.createUser({
      first_name,
      last_name,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
    });

    // --- Envoi du mail de bienvenue ---
    if (email) {
      const subject = 'Bienvenue sur Jungle 🎉';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h1 style="color: #fbb344;">Bienvenue, ${first_name} !</h1>
          <p>Votre compte a été créé avec succès.</p>
          <p>Veuillez confirmer votre adresse email avec le code ci-dessous :</p>
          <h2 style="color:#fbb344;letter-spacing:3px;">{{CODE}}</h2>
          <p style="margin-top: 20px;">Ce code est valable pendant 15 minutes.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
          <p style="font-size:12px;color:#888;">Si vous n'avez pas créé ce compte, ignorez ce message.</p>
        </div>
      `;

      // --- Génération du code ---
      const code = await this.verificationCodeService.createVerificationCode(
        email,
        VerificationType.ACCOUNT,
      );

      // --- Envoi de l’email avec le code ---
      const finalHtml = html.replace('{{CODE}}', code);
      await this.mailService.sendMail({
        to: email,
        subject,
        html: finalHtml,
      });
    }

    return { message: 'Utilisateur créé. Un code de vérification a été envoyé par email.' };
  }

async verifyAccountCode(email: string, code: string) {
  const isValid = await this.verificationCodeService.verifyCode(
    email,
    code,
    VerificationType.ACCOUNT,
  );

  if (!isValid) {
    throw new BadRequestException('Code invalide ou expiré.');
  }

  return { message: 'Code validé avec succès. Vous pouvez maintenant accéder à votre tableau de bord.' };
}


generateTokens(user: UserDocument): TokensDto {
  const accessPayload = {
    sub: user.id.toString(),  // ID de l'utilisateur sous forme de string
    email: user.email,
    first_name: user.first_name,
    role: user.role,
    currentStoreIds: user.stores?.map(id => id.toString()) || [],  // tous les magasins de l'utilisateur
  };

  const refreshPayload = {
    sub: user.id.toString(),
  };

  console.log('Access Payload:', accessPayload);

  return {
    access_token: this.jwtService.sign(accessPayload),
    refresh_token: this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
    }),
  };
}


  
async signIn(  login: string,  password: string
): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  console.log(login);

  // Validation de l'entrée
  if (!login || typeof login !== 'string') {
    throw new UnauthorizedException('Login invalide');
  }

  // Vérification si c'est un téléphone ou un email
  const isPhone = /^\+?\d+$/.test(login);
  let user;

  if (isPhone) {
    // Recherche de l'utilisateur par téléphone
    user = await this.userService.findByPhone(login);
  } else {
    // Recherche de l'utilisateur par email ou username (en minuscules)
    const loginLower = login.toLowerCase();
    user = await this.userService.findOneByEmailOrUsername(loginLower);
  }

  if (!user) {
    throw new UnauthorizedException('Utilisateur non trouvé. Créez un compte.');
  }

  // Vérification du mot de passe
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Mot de passe incorrect.');
  }

  // Génération des tokens (access_token et refresh_token)
  const tokens = this.generateTokens(user);

  return {
    ...tokens,
  };
}




  async verifyPhoneOtp(phone: string, otp: string): Promise<{ access_token: string; refresh_token: string }> {
    const isOtpValid = await this.otpService.verify(phone, otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('OTP invalide ou expiré');
    }

    const user = await this.userService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const authIdentity = await this.authIdentityModel.findOne({ phone });
    if (!authIdentity) {
      throw new UnauthorizedException('Identité non trouvée');
    }

    return this.generateTokens(user);
  }

  async refresh(refresh_token: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userService.findOneById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable.');
      }

      const authIdentity = await this.authIdentityModel.findOne({ user: user._id });
      if (!authIdentity) {
        throw new UnauthorizedException('Identité non trouvée.');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id.toString(),
          auth_identity: authIdentity.id.toString(),
          first_name: user.first_name,
        },
        {
          expiresIn: '1h',
          secret: process.env.JWT_SECRET,
        },
      );

      return { access_token: newAccessToken };
    } catch (e) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }
  }

  async findOne(id: string): Promise<AuthIdentity | null> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID invalide');
    }
    return this.authIdentityModel.findById(id).populate('providerIdentities').exec();
  }

  async update(id: string, updateAuthDto: UpdateAuthDto): Promise<AuthIdentity | null> {
    return this.authIdentityModel
      .findByIdAndUpdate(id, updateAuthDto, { new: true })
      .populate('providerIdentities')
      .exec();
  }

  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    const result = await this.authIdentityModel.findByIdAndDelete(id).exec();
    if (result) {
      return { deleted: true, message: `AuthIdentity ${id} supprimée.` };
    } else {
      return { deleted: false, message: `AuthIdentity ${id} non trouvée.` };
    }
  }

  async findUser(id:string){
    return await this.userModel.findById(id).select('-password').exec();
  }

   async findOrCreateUser(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    // 1. Vérifie si l'utilisateur existe déjà
    let user = await this.userModel.findOne({ email: profile.email }).exec();

    // 2. Crée l'utilisateur s'il n'existe pas
    if (!user) {
      user = new this.userModel({
        email: profile.email,
        first_name: profile.firstName || 'Utilisateur',
        last_name: profile.lastName || 'Google',
        is_active: true,
      });
      await user.save();
    }

    return user;
  }

  

  // Supprimer des identités de provider
  async deleteProviderIdentities(ids: string[]) {
    // Supprimer des identités de provider
  }

  async listAuthIdentities(userId: string) {
    // Lister les identités d’un utilisateur
  }

  async listAndCountAuthIdentities() {
    // Lister avec pagination ou count
  }

  async listProviderIdentities(userId: string) {
    // Lister identités de provider
  }

  async retrieveAuthIdentity(id: string) {
    // Récupérer une identité par ID
  }

  async retrieveProviderIdentity(id: string) {
    // Récupérer une identité de provider
  }

  async updateAuthIdentities(data: UpdateAuthIdentityDto[]) {
    // Mettre à jour
  }

  async updateProviderIdentities(data: UpdateProviderIdentityDto[]) {
    // Mettre à jour
  }

  async updateProvider(data: UpdateProviderDto) {
    // Mettre à jour un provider (config ou metadata)
  }

  async validateCallback(token: string) {
    // Valider un retour d’auth externe
  }

async validateUser(username: string, pass: string): Promise<any> {
  console.log(username, pass);
  
  const isPhone = /^\+?\d+$/.test(username);
  let user;

  if (isPhone) {
    // Recherche de l'utilisateur par téléphone
    user = await this.userService.findByPhone(username);
  } else {
    // Recherche de l'utilisateur par email ou username (en minuscules)
    const usernameLower = username.toLowerCase();
    user = await this.userService.findOneByEmailOrUsername(usernameLower);
  }

  if (!user) {
    throw new UnauthorizedException('Utilisateur non trouvé. Créez un compte.');
  }

  // Vérification du mot de passe
  const isPasswordValid = await bcrypt.compare(pass, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Mot de passe incorrect.');
  }

  // Si tout est valide, on retourne l'utilisateur
  return user;
}

  login(user: any) {
    // console.log(user, 'authser log')
    // const payload = { username: user.email, sub: user._id.toString() };
    // console.log(payload, 'payload')
  
    // return { access_token: this.jwtService.sign(payload) };
  

    return this.generateTokens(user);

    // return {
    //   ...tokens,
    //   role: user.role ?? 'user', //  retourne le rôle pour le frontend
    // };
  }


  

  

}